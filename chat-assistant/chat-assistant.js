// ================================================
// AI CHAT ASSISTANT - WebGIS Bandung - WORKING VERSION
// Powered by Google Gemini API
// ================================================

const CONFIG_AI = {
    PROXY_URL: 'https://gemini-proxy-bandung.badarbaradja112.workers.dev/', // API Key Anda
    MODEL_TARGET: 'gemini-2.5-flash',
    
    // PERBAIKAN: Tambahkan dua properti di bawah ini agar kode jalan
    API_VERSION: 'v1beta', 
    MODELS_TO_TRY: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'] 
};

class BandungTravelAssistant {
    constructor() {
        this.conversationHistory = [];
        this.touristData = null;
        this.isProcessing = false;
        this.initialized = false;
    }

    async loadTouristData() {
        try {
            console.log('📄 Loading tourist data...');
            const paths = [
                'GEOJSON/LokasiWisataAlamBandung.json',
                'GEOJSON/LokasiWisataBudayaBandung.json', 
                'GEOJSON/LokasiWisataKulinerBandung.json',
                'GEOJSON/LokasiWisataRekreasiBandung.json'
            ];

            const loadedData = [];
            
            for (const path of paths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const data = await response.json();
                        loadedData.push(data.features || []);
                        console.log(`✅ Loaded ${path}`);
                    } else {
                        loadedData.push([]);
                    }
                } catch (error) {
                    console.error(`❌ Error loading ${path}:`, error);
                    loadedData.push([]);
                }
            }

            this.touristData = {
                nature: loadedData[0],
                culture: loadedData[1], 
                culinary: loadedData[2],
                recreation: loadedData[3]
            };
            
            this.initialized = true;
            console.log('✅ Tourist data ready');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to load data:', error);
            this.touristData = {
                nature: [], culture: [], culinary: [], recreation: []
            };
            this.initialized = true;
            return false;
        }
    }

    prepareContextData() {
        if (!this.touristData || !this.initialized) {
            return 'DATABASE: Loading...\n';
        }

        let context = 'DATABASE WISATA BANDUNG:\n';

        const processFeatures = (features, category) => {
            if (!features || features.length === 0) return '';
            let str = `\n${category}:\n`;
            features.slice(0, 8).forEach(f => {
                const p = f.properties;
                if (p && p.Nama) {
                    str += `- ${p.Nama} (${p.Kecamatan || 'Bandung'})\n`;
                }
            });
            return str;
        };

        context += processFeatures(this.touristData.nature, '🌲 WISATA ALAM');
        context += processFeatures(this.touristData.culture, '🏛️ BUDAYA');
        context += processFeatures(this.touristData.culinary, '🍜 KULINER');
        context += processFeatures(this.touristData.recreation, '🎡 REKREASI');

        return context;
    }

    async sendMessage(userMessage) {
        if (this.isProcessing) {
            return { error: 'Tunggu sebentar...' };
        }
        
        if (!this.initialized) {
            return { error: 'AI sedang loading, coba lagi...' };
        }

        this.isProcessing = true;
        console.log('🔄 Processing:', userMessage);

        try {
            const context = this.prepareContextData();
            
            const prompt = `Kamu adalah BandungBot, asisten wisata Bandung yang ramah dan helpful.

${context}

INSTRUKSI:
- Jawab dalam Bahasa Indonesia yang friendly & casual
- Rekomendasikan tempat dari database di atas
- Kalau tidak ada data spesifik, berikan saran umum
- Jawab singkat (2-3 kalimat)
- Gunakan emoji yang sesuai

Pertanyaan: ${userMessage}

Jawaban:`;

            const result = await this.tryGenerateWithFallback(prompt);
            const aiMessage = result.text.trim();

            this.conversationHistory.push({ user: userMessage, bot: aiMessage });
            if (this.conversationHistory.length > 10) {
                this.conversationHistory.shift();
            }

            this.isProcessing = false;
            
            return {
                success: true,
                message: aiMessage,
                locations: this.extractLocations(aiMessage)
            };

        } catch (error) {
            console.error('❌ Error:', error);
            this.isProcessing = false;
            
            return { 
                error: `Waduh, ada gangguan teknis 😅

Coba tanya:
🌲 Wisata alam sejuk
🍜 Kuliner Bandung
🏛️ Tempat bersejarah
🎡 Rekreasi keluarga`
            };
        }
    }

    extractLocations(message) {
        if (!this.touristData || !this.initialized) return [];
        
        const locations = [];
        const uniqueNames = new Set();
        
        try {
            const allPlaces = [
                ...(this.touristData.nature || []),
                ...(this.touristData.culture || []),
                ...(this.touristData.culinary || []),
                ...(this.touristData.recreation || [])
            ];

            allPlaces.forEach(place => {
                if (place?.properties?.Nama) {
                    const name = place.properties.Nama;
                    const nameLower = name.toLowerCase();
                    const messageLower = message.toLowerCase();

                    if (messageLower.includes(nameLower) && !uniqueNames.has(nameLower)) {
                        uniqueNames.add(nameLower);
                        
                        if (place.geometry?.coordinates) {
                            locations.push({
                                name: name,
                                coords: place.geometry.coordinates,
                                kecamatan: place.properties.Kecamatan || 'Bandung'
                            });
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Extract error:', error);
        }

        return locations;
    }

    resetConversation() { 
        this.conversationHistory = [];
        console.log('💬 Conversation reset');
    }
}

// UI Controller
class ChatUI {
    constructor() {
        this.assistant = new BandungTravelAssistant();
        this.chatContainer = null;
        this.isOpen = false;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        console.log('🔄 Initializing ChatUI...');
        
        try {
            this.createChatWidget();
            this.assistant.loadTouristData();
            this.attachEventListeners();
            this.initialized = true;
            console.log('✅ ChatUI ready');
        } catch (error) {
            console.error('❌ Init failed:', error);
        }
    }

    createChatWidget() {
        if (document.getElementById('chatFAB')) {
            this.chatContainer = document.getElementById('chatBody');
            return;
        }

        const widget = document.createElement('div');
        widget.innerHTML = `
            <button class="chat-fab" id="chatFAB">
                <i class="ri-chat-smile-3-line"></i>
                <span class="chat-notification"></span>
            </button>
            <div class="chat-window" id="chatWindow">
                <div class="chat-header">
                    <div class="chat-header-info">
                        <div class="chat-avatar"><i class="ri-robot-2-line"></i></div>
                        <div>
                            <h3>BandungBot</h3>
                            <p class="chat-status">🟢 Online</p>
                        </div>
                    </div>
                    <div class="chat-actions">
                        <button class="chat-action-btn" id="chatReset">
                            <i class="ri-refresh-line"></i>
                        </button>
                        <button class="chat-action-btn" id="chatClose">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                </div>
                <div class="chat-body" id="chatBody">
                    <div class="chat-message bot">
                        <div class="message-avatar"><i class="ri-robot-2-line"></i></div>
                        <div class="message-content">
                            <p><strong>Sampurasun! 🙏</strong></p>
                            <p>Aku BandungBot! Mau explore wisata apa hari ini?</p>
                            <div class="quick-replies">
                                <button class="quick-reply" data-msg="Wisata alam yang sejuk">🌲 Alam</button>
                                <button class="quick-reply" data-msg="Kuliner enak di Bandung">🍜 Kuliner</button>
                                <button class="quick-reply" data-msg="Wisata budaya">🏛️ Budaya</button>
                                <button class="quick-reply" data-msg="Rekreasi keluarga">🎡 Rekreasi</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chat-input-wrapper">
                    <div class="chat-typing" id="chatTyping" style="display:none;">
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span class="typing-text">Mengetik...</span>
                    </div>
                    <div class="chat-input-container">
                        <input type="text" class="chat-input" id="chatInput" placeholder="Tanya wisata Bandung..." autocomplete="off">
                        <button class="chat-send-btn" id="chatSend">
                            <i class="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(widget);
        this.chatContainer = document.getElementById('chatBody');
    }

    attachEventListeners() {
        document.getElementById('chatFAB')?.addEventListener('click', () => this.toggleChat());
        document.getElementById('chatClose')?.addEventListener('click', () => this.closeChat());
        document.getElementById('chatSend')?.addEventListener('click', () => this.handleSendMessage());
        
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleSendMessage();
            }
        });

        document.getElementById('chatReset')?.addEventListener('click', () => {
            this.assistant.resetConversation();
            this.chatContainer.innerHTML = `
                <div class="chat-message bot">
                    <div class="message-avatar"><i class="ri-robot-2-line"></i></div>
                    <div class="message-content">
                        <p>Chat direset! 🔄</p>
                        <p>Mau cari wisata apa?</p>
                        <div class="quick-replies">
                            <button class="quick-reply" data-msg="Wisata alam">🌲 Alam</button>
                            <button class="quick-reply" data-msg="Kuliner">🍜 Kuliner</button>
                            <button class="quick-reply" data-msg="Budaya">🏛️ Budaya</button>
                        </div>
                    </div>
                </div>
            `;
            this.scrollToBottom();
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-reply')) {
                this.sendMessage(e.target.closest('.quick-reply').dataset.msg);
            }
            
            if (e.target.closest('.location-btn')) {
                const btn = e.target.closest('.location-btn');
                this.showLocationOnMap(btn.dataset.name, btn.dataset.lat, btn.dataset.lon);
            }
        });
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        document.getElementById('chatWindow').classList.toggle('active', this.isOpen);
        
        if (this.isOpen) {
            document.querySelector('.chat-notification').style.display = 'none';
            document.getElementById('chatInput')?.focus();
        }
    }
    
    closeChat() {
        this.isOpen = false;
        document.getElementById('chatWindow').classList.remove('active');
    }

    async handleSendMessage() {
        const input = document.getElementById('chatInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        input.value = '';
        await this.sendMessage(text);
    }

    async sendMessage(text) {
        if (!text.trim()) return;
        
        this.addMessage(text, 'user');
        this.showTypingIndicator(true);
        
        try {
            const response = await this.assistant.sendMessage(text);
            this.showTypingIndicator(false);
            
            if (response.error) {
                this.addMessage(response.error, 'bot');
            } else {
                this.addMessage(response.message, 'bot', response.locations);
            }
            
        } catch (error) {
            this.showTypingIndicator(false);
            this.addMessage('Error! Coba lagi 😅', 'bot');
        }
        
        this.scrollToBottom();
    }

    addMessage(text, sender, locations = []) {
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        
        const icon = sender === 'bot' ? 'ri-robot-2-line' : 'ri-user-3-line';
        const formatted = this.formatMessage(text);
        
        let locsHTML = '';
        if (locations?.length > 0) {
            locsHTML = '<div class="location-buttons">';
            locations.forEach(loc => {
                locsHTML += `
                    <button class="location-btn" 
                            data-lat="${loc.coords[1]}" 
                            data-lon="${loc.coords[0]}" 
                            data-name="${loc.name}">
                        <i class="ri-map-pin-line"></i> ${loc.name}
                    </button>
                `;
            });
            locsHTML += '</div>';
        }
        
        div.innerHTML = `
            <div class="message-avatar"><i class="${icon}"></i></div>
            <div class="message-content">
                <div class="message-text">${formatted}</div>
                ${locsHTML}
            </div>
        `;
        
        this.chatContainer.appendChild(div);
        this.scrollToBottom();
    }

    formatMessage(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator(show) {
        document.getElementById('chatTyping').style.display = show ? 'flex' : 'none';
        if (show) this.scrollToBottom();
    }

    scrollToBottom() {
        if (this.chatContainer) {
            setTimeout(() => {
                this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
            }, 100);
        }
    }

    showLocationOnMap(name, lat, lon) {
        console.log(`📍 Show: ${name}`);
        
        if (window.innerWidth < 768) this.closeChat();
        
        document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' });
        
        setTimeout(() => {
            const iframe = document.getElementById('mapIframe');
            iframe?.contentWindow?.postMessage({
                type: 'FLY_TO_LOCATION',
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                name: name
            }, '*');
        }, 1000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting BandungBot...');
    setTimeout(() => {
        const chat = new ChatUI();
        chat.init();
    }, 1500);
});

window.BandungChatAssistant = ChatUI;