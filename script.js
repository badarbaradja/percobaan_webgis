document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================================
    // 1. UI SETUP (Menu, Theme, Cursor)
    // ============================================================
    
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // --- Mobile Menu ---
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });

        // Tutup menu saat link diklik
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }

    // --- Theme Toggle ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        if(themeToggle) themeToggle.checked = true;
        body.setAttribute('data-theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            body.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
        });
    }

    // --- Cursor Glow Effect ---
    const glowEffect = document.querySelector('.cursor-glow');
    if (glowEffect) {
        document.addEventListener('mousemove', (e) => {
            const x = e.clientX;
            const y = e.clientY;
            glowEffect.style.setProperty('--x', x + 'px');
            glowEffect.style.setProperty('--y', y + 'px');
        });
    }

    // ============================================================
    // 2. INTEGRASI PETA & PENCARIAN
    // ============================================================
    
    const mapIframe = document.getElementById('mapIframe');
    
    // --- A. HERO SEARCH LOGIC ---
    const heroInput = document.getElementById('heroSearchInput');
    const heroSuggestions = document.getElementById('heroSuggestions');
    const searchBtn = document.querySelector('.search-btn');

    if (heroInput && heroSuggestions && mapIframe) {
        
        // Event Ketik
        heroInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Cek Koneksi API ke Iframe
            const iframeWindow = mapIframe.contentWindow;
            if (!iframeWindow || !iframeWindow.WebGIS_API) return;

            if (query.length < 2) {
                heroSuggestions.classList.remove('show');
                return;
            }

            // Panggil Search API
            const results = iframeWindow.WebGIS_API.search(query);
            displayHeroSuggestions(results);
        });

        // Fungsi Tampilkan Dropdown
        function displayHeroSuggestions(results) {
            heroSuggestions.innerHTML = '';
            if (results.length === 0) {
                heroSuggestions.classList.remove('show');
                return;
            }

            results.forEach(item => {
                const props = item.properties;
                const coords = item.geometry.coordinates;

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
                    
                    // Scroll & Zoom Peta
                    const mapSection = document.getElementById('explore');
                    if(mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
                    
                    const iframeWindow = mapIframe.contentWindow;
                    if(iframeWindow && iframeWindow.WebGIS_API) {
                        iframeWindow.WebGIS_API.flyToLocation(coords[1], coords[0]);
                    }
                };
                heroSuggestions.appendChild(div);
            });
            heroSuggestions.classList.add('show');
        }

        // Klik di luar nutup dropdown
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-wrapper')) {
                heroSuggestions.classList.remove('show');
            }
        });
    }

    // --- B. SIDEBAR MASTER-DETAIL LOGIC ---
    const categoryCards = document.querySelectorAll('.cat-card-mini');
    const categoryMenu = document.getElementById('categoryMenu');
    const placesList = document.getElementById('placesList');
    const defaultHeader = document.getElementById('defaultHeader');
    const listHeader = document.getElementById('listHeader');
    const backBtn = document.getElementById('backToCategories');
    const categoryTitle = document.getElementById('selectedCategoryTitle');

    const categoryNames = {
        'nature': 'Wisata Alam',
        'culture': 'Cagar Budaya',
        'culinary': 'Pusat Kuliner',
        'recreation': 'Rekreasi'
    };

    if (categoryCards && mapIframe) {
        // Klik Kategori -> Masuk Mode List
        categoryCards.forEach(card => {
            card.addEventListener('click', () => {
                const categoryKey = card.getAttribute('data-category');
                const iframeWindow = mapIframe.contentWindow;

                if (!iframeWindow || !iframeWindow.WebGIS_API) {
                    console.warn("Peta belum siap.");
                    return;
                }

                // UI Switch
                categoryMenu.style.display = 'none';
                placesList.style.display = 'flex';
                defaultHeader.style.display = 'none';
                listHeader.style.display = 'block';
                categoryTitle.textContent = categoryNames[categoryKey] || 'Daftar Lokasi';

                // Logic: Filter Map & Get Data
                iframeWindow.WebGIS_API.filterMap(categoryKey);
                const data = iframeWindow.WebGIS_API.getDataByCategory(categoryKey);
                renderSidebarList(data);
            });
        });
    }

    // Tombol Kembali -> Masuk Mode Menu
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            categoryMenu.style.display = 'flex';
            placesList.style.display = 'none';
            defaultHeader.style.display = 'block';
            listHeader.style.display = 'none';

            // Reset Peta
            const iframeWindow = mapIframe.contentWindow;
            if (iframeWindow && iframeWindow.WebGIS_API) {
                iframeWindow.WebGIS_API.filterMap('all');
            }
        });
    }

    // Render List di Sidebar
    function renderSidebarList(dataFeatures) {
        placesList.innerHTML = '';

        if (dataFeatures.length === 0) {
            placesList.innerHTML = '<p class="text-muted text-center" style="padding:20px;">Tidak ada data lokasi.</p>';
            return;
        }

        dataFeatures.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;
            const imgUrl = props.gambar || 'https://via.placeholder.com/60';

            const item = document.createElement('div');
            item.className = 'place-card-item';
            item.innerHTML = `
                <img src="${imgUrl}" class="place-thumbnail" alt="${props.Nama}" onerror="this.src='https://via.placeholder.com/60'">
                <div class="place-info">
                    <h5>${props.Nama}</h5>
                    <p><i class="ri-map-pin-line"></i> ${props.Kecamatan || 'Bandung'}</p>
                </div>
            `;

            // Klik Item List -> FlyTo Map
            item.addEventListener('click', () => {
                const iframeWindow = mapIframe.contentWindow;
                if (iframeWindow && iframeWindow.WebGIS_API) {
                    iframeWindow.WebGIS_API.flyToLocation(coords[1], coords[0]);
                }
                // Mobile UX: Scroll ke peta
                if(window.innerWidth < 768) {
                    mapIframe.scrollIntoView({behavior: "smooth"});
                }
            });

            placesList.appendChild(item);
        });
    }
});