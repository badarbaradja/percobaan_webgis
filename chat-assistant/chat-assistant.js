// ================================================
// AI CHAT ASSISTANT - WebGIS Bandung - FIXED VERSION
// Powered by Google Gemini API via Cloudflare Proxy
// ================================================

const CONFIG_AI = {
    // URL Backend Cloudflare Worker Kamu
    PROXY_URL: 'https://gemini-proxy-bandung.badarbaradja112.workers.dev/', 
    
    // Model target (Logika pemilihan model sebenarnya ada di Backend/Worker)
    MODEL_TARGET: 'gemini-1.5-flash' 
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
            // Menggunakan path relative yang aman
            const paths = [
                'GEOJSON/LokasiWisataAlamBandung.json',
                'GEOJSON/LokasiWisataBudayaBandung.json', 
                'GEOJSON/LokasiWisataKulinerBandung.json',
                'GEOJSON/LokasiWisataRekreasiBandung.json'
            ];

            const loadedData = [];
            
            for (const path of paths) {
                try {
                    // Coba fetch, handle jika path berbeda di live server vs local
                    let response = await fetch(path);
                    if (!response.ok) {
                        // Fallback jika folder structure berbeda (misal di root HTML)
                        response = await fetch('../' + path);
                    }
                    
                    if (response.ok) {
                        const data = await response.json();
                        loadedData.push(data.features || []);
                        console.log(`✅ Loaded ${path}`);
                    } else {
                        console.warn(`⚠️ Failed to load ${path}`);
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
            // Batasi data context agar tidak terlalu besar (token limit)
            features.slice(0, 15).forEach(f => {
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

    // --- BAGIAN YANG DIPERBAIKI ---
    // Fungsi ini sekarang memanggil Proxy, bukan Google langsung
    async tryGenerateWithFallback(prompt) {
        try {
            console.log('🔄 Sending request to Proxy Cloudflare...');
            
            const response = await fetch(CONFIG_AI.PROXY_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            
            // Cek jika backend mengembalikan error
            if (data.error) {
                throw new Error(data.error.message || data.error);
            }

            // Validasi struktur response Gemini
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No candidates in response (AI tidak memberikan jawaban)');
            }

            const candidate = data.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                throw new Error('Invalid response structure');
            }

            console.log('✅ Success receive answer from AI!');
            return { 
                success: true, 
                text: candidate.content.parts[0].text,
                modelUsed: 'gemini-1.5-flash (via proxy)'
            };

        } catch (error) {
            console.error('❌ AI Generation Failed:', error.message);
            throw error;
        }
    }
    // -------------------------------

    async sendMessage(userMessage) {
        if (this.isProcessing) {
            return { error: 'Tunggu sebentar...' };
        }
        
        if (!this.initialized) {
            return { error: 'AI sedang memuat data wisata, coba lagi dalam beberapa detik...' };
        }

        this.isProcessing = true;
        console.log('🔄 Processing user message:', userMessage);

        try {
            const context = this.prepareContextData();
            
            // Prompt Engineering
            const prompt = `Kamu adalah BandungBot, asisten wisata digital untuk Kota Bandung yang ramah, gaul, dan sangat membantu.

DATA WISATA YANG KAMU TAHU:
${context}

INSTRUKSI PENTING:
1. Jawablah pertanyaan user menggunakan Bahasa Indonesia yang santai tapi sopan.
2. Gunakan Data Wisata di atas untuk memberikan rekomendasi yang akurat.
3. Jika user bertanya tentang tempat yang ada di database, berikan info detailnya.
4. Jika tempat tidak ada di database, berikan saran umum seputar wisata Bandung.
5. Jawab dengan ringkas (maksimal 3 paragraf pendek).
6. Gunakan emoji yang relevan agar chat lebih hidup.

User Bertanya: "${userMessage}"

Jawaban Kamu:`;

            const result = await this.tryGenerateWithFallback(prompt);
            const aiMessage = result.text.trim();

            // Simpan history (opsional untuk pengembangan lanjut)
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
            console.error('❌ Error in sendMessage:', error);
            this.isProcessing = false;
            
            return { 
                error: `Maaf, koneksi ke otak AI sedang gangguan 😅. 
                
Pesan error: ${error.message}. 
Coba cek koneksi internetmu atau coba lagi nanti.`
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

                    // Cek apakah nama tempat disebut dalam jawaban AI
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
            console.error('Extract location error:', error);
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
            await this.assistant.loadTouristData(); // Tunggu data load
            this.attachEventListeners();
            this.initialized = true;
            console.log('✅ ChatUI ready');
        } catch (error) {
            console.error('❌ ChatUI Init failed:', error);
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
                        <button class="chat-action-btn" id="chatReset" title="Reset Chat">
                            <i class="ri-refresh-line"></i>
                        </button>
                        <button class="chat-action-btn" id="chatClose" title="Tutup">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                </div>
                <div class="chat-body" id="chatBody">
                    <div class="chat-message bot">
                        <div class="message-avatar"><i class="ri-robot-2-line"></i></div>
                        <div class="message-content">
                            <p><strong>Sampurasun! 🙏</strong></p>
                            <p>Aku BandungBot! Mau cari wisata alam, kuliner, atau sejarah hari ini?</p>
                            <div class="quick-replies">
                                <button class="quick-reply" data-msg="Rekomendasi wisata alam sejuk">🌲 Alam</button>
                                <button class="quick-reply" data-msg="Kuliner legendaris Bandung">🍜 Kuliner</button>
                                <button class="quick-reply" data-msg="Tempat wisata sejarah">🏛️ Budaya</button>
                                <button class="quick-reply" data-msg="Tempat rekreasi keluarga">🎡 Rekreasi</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="chat-input-wrapper">
                    <div class="chat-typing" id="chatTyping" style="display:none;">
                        <div class="typing-dots">
                            <span></span><span></span><span></span>
                        </div>
                        <span class="typing-text">Sedang mengetik...</span>
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
                        <p>Chat sudah direset! 🔄</p>
                        <p>Mau cari info apa lagi?</p>
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
            setTimeout(() => document.getElementById('chatInput')?.focus(), 100);
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
            this.addMessage('Terjadi kesalahan sistem. Silakan coba lagi.', 'bot');
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
                        <i class="ri-map-pin-line"></i> Lihat: ${loc.name}
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
        // Convert Markdown bold to HTML strong
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Convert newlines to <br>
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
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
        console.log(`📍 Showing on map: ${name}`);
        
        if (window.innerWidth < 768) this.closeChat();
        
        const mapSection = document.getElementById('explore');
        if (mapSection) {
            mapSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Kirim pesan ke iframe peta (jika menggunakan iframe)
        setTimeout(() => {
            const iframe = document.getElementById('mapIframe');
            // Coba panggil API WebGIS jika tersedia di window (direct access)
            if (window.WebGIS_API && window.WebGIS_API.flyToLocation) {
                window.WebGIS_API.flyToLocation(parseFloat(lat), parseFloat(lon));
            } 
            // Atau kirim postMessage ke iframe
            else if (iframe && iframe.contentWindow) {
                // Pastikan iframe punya listener atau akses ke fungsi global di dalamnya
                // Jika iframe cross-origin atau butuh cara khusus:
                try {
                    iframe.contentWindow.WebGIS_API.flyToLocation(parseFloat(lat), parseFloat(lon));
                } catch (e) {
                    console.log('Mencoba postMessage...');
                    iframe.contentWindow.postMessage({
                        type: 'FLY_TO_LOCATION',
                        lat: parseFloat(lat),
                        lon: parseFloat(lon),
                        name: name
                    }, '*');
                }
            }
        }, 1000);
    }
}

// Initialize Chat Assistant
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting BandungBot Chat Assistant...');
    setTimeout(() => {
        const chat = new ChatUI();
        chat.init();
        // Expose global untuk debugging
        window.BandungChatAssistantInstance = chat;
    }, 1500);
});