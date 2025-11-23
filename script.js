document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. UI SETUP (Hamburger, Theme, dll) ---
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // Mobile Menu
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Theme Toggle
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        if(themeToggle) themeToggle.checked = true;
        body.setAttribute('data-theme', 'dark');
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    // --- 2. LOGIKA PENCARIAN HERO (YANG PENTING INI) ---
    const heroInput = document.getElementById('heroSearchInput');
    const heroSuggestions = document.getElementById('heroSuggestions');
    const mapIframe = document.getElementById('mapIframe');

    // Cek apakah elemen ada
    if (!heroInput || !heroSuggestions || !mapIframe) {
        console.error("❌ Elemen pencarian tidak ditemukan di HTML.");
        return;
    }

    // Event saat mengetik
    heroInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // 1. Cek Koneksi ke Peta
        if (!mapIframe.contentWindow || !mapIframe.contentWindow.WebGIS_API) {
            console.warn("⏳ Peta belum siap atau API tidak terhubung. Tunggu sebentar...");
            return;
        }

        // 2. Jika ketikan kurang dari 2 huruf, sembunyikan
        if (query.length < 2) {
            heroSuggestions.classList.remove('show');
            return;
        }

        // 3. Minta data ke Peta
        console.log("🔍 Mencari:", query); // Debugging
        const results = mapIframe.contentWindow.WebGIS_API.search(query);
        console.log("✅ Ditemukan:", results.length, "hasil"); // Debugging

        displayHeroSuggestions(results);
    });

    // Fungsi menampilkan dropdown
    function displayHeroSuggestions(results) {
        heroSuggestions.innerHTML = '';

        if (results.length === 0) {
            heroSuggestions.classList.remove('show');
            return;
        }

        results.forEach(item => {
            const props = item.properties;
            const coords = item.geometry.coordinates; // [Lon, Lat]

            const div = document.createElement('div');
            div.className = 'hero-suggestion-item';
            div.innerHTML = `
                <div class="hero-suggestion-icon">
                    <i class="ri-map-pin-line"></i>
                </div>
                <div class="hero-suggestion-content">
                    <h4>${props.Nama}</h4>
                    <p>${props.Kecamatan || 'Bandung'}</p>
                </div>
            `;

            div.onclick = () => {
                heroInput.value = props.Nama;
                heroSuggestions.classList.remove('show');

                // Scroll ke Peta
                const mapSection = document.getElementById('explore');
                if(mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });

                // Zoom Peta (Tukar koordinat jadi Lat, Lon)
                mapIframe.contentWindow.WebGIS_API.flyToLocation(coords[1], coords[0]);
            };

            heroSuggestions.appendChild(div);
        });

        heroSuggestions.classList.add('show');
    }

    // Tutup dropdown kalau klik di luar
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            heroSuggestions.classList.remove('show');
        }
    });
});