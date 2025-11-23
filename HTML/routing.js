// ================================================
// WEBGIS ROUTING - MAIN JAVASCRIPT FILE
// ================================================

// Configuration
const CONFIG = {
    GRAPHHOPPER_API_KEY: 'fa19c46e-6b91-4af6-ba21-d17d6d9e1db6',
    BANDUNG_CENTER: [-6.9175, 107.6191],
    DEFAULT_ZOOM: 13,
    GEOJSON_PATHS: [
        'GEOJSON/LokasiWisataAlamBandung.json',
        'GEOJSON/LokasiWisataBudayaBandung.json',
        'GEOJSON/LokasiWisataKulinerBandung.json',
        'GEOJSON/LokasiWisataRekreasiBandung.json'
    ]
};

// Map Layers
const mapLayers = {
    default: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        maxZoom: 20
    }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© Esri',
        maxZoom: 19
    }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        maxZoom: 20
    })
};

// Initialize Map
const map = L.map('map', {
    zoomControl: false,
    layers: [mapLayers.default]
}).setView(CONFIG.BANDUNG_CENTER, CONFIG.DEFAULT_ZOOM);

// Application State
const appState = {
    currentRoute: null,
    routePolylines: [], // Array untuk menyimpan banyak rute
    startMarker: null,
    endMarker: null,
    userLocationMarker: null,
    selectedMode: 'car',
    startCoords: null,
    endCoords: null,
    routeData: null,
    markerCluster: L.markerClusterGroup(),
    currentCategory: 'all',
    allMarkers: []
};

// Tourist Data Storage
const touristData = {
    nature: [],
    culture: [],
    culinary: [],
    recreation: []
};

// ================================================
// INITIALIZATION
// ================================================

async function initApp() {
    console.log('%c🗺️ WebGIS Routing App Initializing...', 'font-size: 16px; font-weight: bold; color: #1A73E8;');
    console.log('%c⌨️ Press Ctrl+D for debug panel', 'color: #666;');
    
    try {
        await loadTouristData();
        setupEventListeners();
        getUserLocation();
        
        // Hide loading overlay
        setTimeout(() => {
            const overlay = document.getElementById('loadingOverlay');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }, 500);
        
        console.log('%c✅ App initialized successfully!', 'color: #34A853; font-weight: bold;');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        hideLoadingOverlay();
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// ================================================
// DATA LOADING
// ================================================

async function loadTouristData() {
    console.log('📥 Loading tourist data...');
    
    try {
        // Try multiple base paths
        const basePaths = ['../', './', '', 'HTML/'];
        let loadedData = null;
        let successPath = '';

        for (const basePath of basePaths) {
            try {
                const paths = CONFIG.GEOJSON_PATHS.map(p => basePath + p);
                const responses = await Promise.all(paths.map(path => fetch(path)));

                // Check if all responses are OK
                if (responses.every(r => r.ok)) {
                    loadedData = await Promise.all(responses.map(r => r.json()));
                    successPath = basePath;
                    console.log(`✅ Data loaded from: ${basePath || '(root)'}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (loadedData) {
            touristData.nature = loadedData[0].features || [];
            touristData.culture = loadedData[1].features || [];
            touristData.culinary = loadedData[2].features || [];
            touristData.recreation = loadedData[3].features || [];

            const totalMarkers = Object.values(touristData).reduce((sum, arr) => sum + arr.length, 0);
            console.log(`📍 Total markers loaded: ${totalMarkers}`);
            console.log(`   🌿 Nature: ${touristData.nature.length}`);
            console.log(`   🏛️ Culture: ${touristData.culture.length}`);
            console.log(`   🍜 Culinary: ${touristData.culinary.length}`);
            console.log(`   🎡 Recreation: ${touristData.recreation.length}`);

            displayMarkers();
        } else {
            console.warn('⚠️ Could not load GeoJSON files. Loading demo data...');
            loadDemoData();
        }
    } catch (error) {
        console.error('❌ Error loading tourist data:', error);
        loadDemoData();
    }
}

function loadDemoData() {
    console.log('📌 Loading demo markers...');
    
    const demoMarkers = [
        { name: 'Trans Studio Bandung', lat: -6.9256, lon: 107.6337, type: 'recreation', category: 'Hiburan', image: 'https://picsum.photos/400/300?random=1' },
        { name: 'Kawah Putih', lat: -7.1545, lon: 107.3821, type: 'nature', category: 'Alam', image: 'https://picsum.photos/400/300?random=2' },
        { name: 'Gedung Sate', lat: -6.9019, lon: 107.6187, type: 'culture', category: 'Budaya', image: 'https://picsum.photos/400/300?random=3' },
        { name: 'Batagor Riri', lat: -6.9276, lon: 107.6194, type: 'culinary', category: 'Kuliner', image: 'https://picsum.photos/400/300?random=4' },
        { name: 'Dago Pakar', lat: -6.8500, lon: 107.6200, type: 'nature', category: 'Alam', image: 'https://picsum.photos/400/300?random=5' }
    ];

    demoMarkers.forEach(marker => {
        const m = L.marker([marker.lat, marker.lon], {
            icon: createCustomIcon(marker.type)
        });

        m.bindPopup(createDemoPopup(marker));
        m.addTo(map);
        
        appState.allMarkers.push({ marker: m, type: marker.type });
    });

    console.log('✅ Demo markers loaded');
}

function createDemoPopup(data) {
    const safeName = data.name.replace(/'/g, "\\'");
    return `
        <div class="popup-content">
            <img src="${data.image}" class="popup-image" alt="${data.name}">
            <div class="popup-title">${data.name}</div>
            <div class="popup-address">
                <i class="ri-map-pin-line"></i>
                ${data.category} • Bandung
            </div>
            <button class="popup-btn" onclick="setDestination('${safeName}', ${data.lat}, ${data.lon})">
                <i class="ri-direction-line"></i>
                <span>Rute ke Sini</span>
            </button>
        </div>
    `;
}

// ================================================
// MARKER DISPLAY
// ================================================

function displayMarkers() {
    // Clear existing markers
    appState.markerCluster.clearLayers();
    appState.allMarkers = [];

    Object.entries(touristData).forEach(([type, features]) => {
        features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const props = feature.properties;

            const marker = L.marker([coords[1], coords[0]], {
                icon: createCustomIcon(type)
            });

            marker.bindPopup(createPopupContent(props, coords));
            appState.markerCluster.addLayer(marker);
            
            appState.allMarkers.push({ marker, type });
        });
    });

    map.addLayer(appState.markerCluster);
    console.log('✅ Markers displayed on map');
}

function createCustomIcon(type) {
    const iconMap = {
        nature: 'ri-leaf-fill',
        culture: 'ri-ancient-pavilion-fill',
        culinary: 'ri-restaurant-2-fill',
        recreation: 'ri-emotion-happy-fill'
    };

    const colorMap = {
        nature: '#10B981',
        culture: '#F59E0B',
        culinary: '#EF4444',
        recreation: '#3B82F6'
    };

    return L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="custom-marker marker-${type}" style="width:40px; height:40px; background:${colorMap[type]}">
            <i class="${iconMap[type]}"></i>
        </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
}

function createPopupContent(props, coords) {
    const safeName = (props.Nama || 'Tempat Wisata').replace(/'/g, "\\'");
    const imageUrl = props.gambar || 'https://via.placeholder.com/280x160?text=No+Image';
    
    return `
        <div class="popup-content">
            <img src="${imageUrl}" 
                 class="popup-image" 
                 alt="${props.Nama}"
                 onerror="this.src='https://via.placeholder.com/280x160?text=No+Image'">
            <div class="popup-title">${props.Nama || 'Tempat Wisata'}</div>
            <div class="popup-address">
                <i class="ri-map-pin-line"></i>
                ${props.Kecamatan || 'Bandung'} • ${props['Kabupaten/Kota'] || 'Kota Bandung'}
            </div>
            <button class="popup-btn" onclick="setDestination('${safeName}', ${coords[1]}, ${coords[0]})">
                <i class="ri-direction-line"></i>
                <span>Rute ke Sini</span>
            </button>
        </div>
    `;
}

// ================================================
// CATEGORY FILTER
// ================================================

function filterCategory(category) {
    appState.currentCategory = category;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Filter markers
    appState.markerCluster.clearLayers();

    appState.allMarkers.forEach(({ marker, type }) => {
        if (category === 'all' || type === category) {
            appState.markerCluster.addLayer(marker);
        }
    });

    console.log(`🔍 Filtered to: ${category}`);
}

// ================================================
// EVENT LISTENERS
// ================================================

function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Route inputs
    document.getElementById('startInput').addEventListener('input', (e) => handleLocationInput(e, 'start'));
    document.getElementById('endInput').addEventListener('input', (e) => handleLocationInput(e, 'end'));

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container') && !e.target.closest('.routing-panel')) {
            document.querySelectorAll('.suggestions-list').forEach(el => el.classList.remove('show'));
        }
        if (!e.target.closest('.layer-switcher')) {
            document.getElementById('layerMenu').classList.remove('show');
        }
    });

    // Debug panel toggle (Ctrl+D)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleDebug();
        }
    });

    console.log('✅ Event listeners setup');
}

// ================================================
// SEARCH FUNCTIONALITY
// ================================================

async function handleSearch(e) {
    const query = e.target.value.trim();
    const container = document.getElementById('searchSuggestions');

    if (query.length < 2) {
        container.classList.remove('show');
        return;
    }

    const results = searchTouristSpots(query);
    displaySearchSuggestions(results, container);
}

function searchTouristSpots(query) {
    const results = [];
    const queryLower = query.toLowerCase();

    Object.values(touristData).forEach(features => {
        features.forEach(feature => {
            const name = (feature.properties.Nama || '').toLowerCase();
            const address = (feature.properties.Kecamatan || '').toLowerCase();
            const category = (feature.properties.Kategori || '').toLowerCase();

            if (name.includes(queryLower) || address.includes(queryLower) || category.includes(queryLower)) {
                results.push(feature);
            }
        });
    });

    return results.slice(0, 8);
}

function displaySearchSuggestions(results, container) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.innerHTML = '<div class="suggestion-item">Tidak ada hasil ditemukan</div>';
        container.classList.add('show');
        return;
    }

    results.forEach(result => {
        const props = result.properties;
        const coords = result.geometry.coordinates;

        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
            <div class="suggestion-icon">
                <i class="ri-map-pin-fill"></i>
            </div>
            <div class="suggestion-content">
                <div class="suggestion-name">${props.Nama}</div>
                <div class="suggestion-address">${props.Kecamatan || 'Bandung'}</div>
            </div>
        `;

        div.onclick = () => {
            map.flyTo([coords[1], coords[0]], 16);
            container.classList.remove('show');
            document.getElementById('searchInput').value = props.Nama;
            
            // Find and open popup
            appState.markerCluster.eachLayer(layer => {
                const latLng = layer.getLatLng();
                if (Math.abs(latLng.lat - coords[1]) < 0.0001 && Math.abs(latLng.lng - coords[0]) < 0.0001) {
                    layer.openPopup();
                }
            });
        };

        container.appendChild(div);
    });

    container.classList.add('show');
}

// ================================================
// ROUTING - INPUT HANDLING
// ================================================

async function handleLocationInput(e, type) {
    const query = e.target.value.trim();
    const containerId = type === 'start' ? 'startSuggestions' : 'endSuggestions';
    const container = document.getElementById(containerId);

    if (query.length < 2) {
        container.classList.remove('show');
        return;
    }

    // Search tourist spots
    const touristResults = searchTouristSpots(query);
    
    // Search using Nominatim
    const nominatimResults = await searchNominatim(query);

    displayLocationSuggestions([...touristResults, ...nominatimResults], container, type);
}

async function searchNominatim(query) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}+Bandung&limit=3`
        );
        const data = await response.json();
        
        return data.map(item => ({
            type: 'nominatim',
            properties: {
                Nama: item.display_name.split(',')[0],
                Kecamatan: item.display_name
            },
            geometry: {
                coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
            }
        }));
    } catch (error) {
        console.error('Nominatim search error:', error);
        return [];
    }
}

function displayLocationSuggestions(results, container, type) {
    container.innerHTML = '';

    if (results.length === 0) {
        container.classList.remove('show');
        return;
    }

    results.forEach(result => {
        const props = result.properties;
        const coords = result.geometry.coordinates;

        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
            <div class="suggestion-icon">
                <i class="ri-map-pin-fill"></i>
            </div>
            <div class="suggestion-content">
                <div class="suggestion-name">${props.Nama}</div>
                <div class="suggestion-address">${props.Kecamatan || 'Bandung'}</div>
            </div>
        `;

        div.onclick = () => {
            selectLocation(props.Nama, coords[1], coords[0], type);
            container.classList.remove('show');
        };

        container.appendChild(div);
    });

    container.classList.add('show');
}

function selectLocation(name, lat, lon, type) {
    const input = document.getElementById(type === 'start' ? 'startInput' : 'endInput');
    input.value = name;
    input.dataset.lat = lat;
    input.dataset.lon = lon;

    if (type === 'start') {
        appState.startCoords = { lat, lon };
        updateStartMarker(lat, lon);
    } else {
        appState.endCoords = { lat, lon };
        updateEndMarker(lat, lon);
    }
}

// ================================================
// ROUTING - MARKERS
// ================================================

function updateStartMarker(lat, lon) {
    if (appState.startMarker) {
        map.removeLayer(appState.startMarker);
    }

    appState.startMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="width:32px; height:32px; background:#1A73E8; border:3px solid white; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        }),
        zIndexOffset: 1000
    }).addTo(map);
}

function updateEndMarker(lat, lon) {
    if (appState.endMarker) {
        map.removeLayer(appState.endMarker);
    }

    appState.endMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div style="width:32px; height:32px; background:#EA4335; border:3px solid white; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        }),
        zIndexOffset: 1000
    }).addTo(map);

    map.setView([lat, lon], 14);
}

function updateUserLocationMarker(lat, lon) {
    if (appState.userLocationMarker) {
        map.removeLayer(appState.userLocationMarker);
    }

    appState.userLocationMarker = L.marker([lat, lon], {
        icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<div class="user-location-marker"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        }),
        zIndexOffset: 999
    }).addTo(map);
}

// ================================================
// ROUTING - CALCULATION
// ================================================

async function calculateRoute() {
    const startLat = document.getElementById('startInput').dataset.lat;
    const startLon = document.getElementById('startInput').dataset.lon;
    const endLat = document.getElementById('endInput').dataset.lat;
    const endLon = document.getElementById('endInput').dataset.lon;

    if (!startLat || !endLat) {
        alert('⚠️ Mohon pilih lokasi awal dan tujuan');
        return;
    }

    // Show loading
    const loadingSpinner = document.getElementById('loadingSpinner');
    loadingSpinner.classList.add('show');
    document.getElementById('routeSummary').classList.remove('show');

    try {
        const profile = getGraphHopperProfile(appState.selectedMode);
        const url = `https://graphhopper.com/api/1/route?` +
            `point=${startLat},${startLon}&` +
            `point=${endLat},${endLon}&` +
            `profile=${profile}&` +
            `locale=id&` +
            `instructions=true&` +
            `calc_points=true&` +
            `points_encoded=true&` +
            `algorithm=alternative_route&` +
            `alternative_route.max_paths=3&` +
            `alternative_route.max_weight_factor=1.4&` + // FIXED: Tambahkan '+' disini
            `key=${CONFIG.GRAPHHOPPER_API_KEY}`;

        console.log('🚗 Calculating route...');
        const response = await fetch(url);
        const data = await response.json();

        if (data.paths && data.paths.length > 0) {
            displayRoutes(data.paths);
            console.log(`✅ Found ${data.paths.length} routes`);
        } else {
            throw new Error(data.message || 'No route found');
        }
    } catch (error) {
        console.error('❌ Routing error:', error);
        alert('❌ Gagal menghitung rute: ' + error.message);
    } finally {
        loadingSpinner.classList.remove('show');
    }
}

function getGraphHopperProfile(mode) {
    const profiles = {
        car: 'car',
        motorcycle: 'motorcycle',
        foot: 'foot',
        bike: 'bike'
    };
    return profiles[mode] || 'car';
}

function displayRoutes(paths) {
    // 1. Bersihkan rute lama jika ada
    if (appState.routePolylines && appState.routePolylines.length > 0) {
        appState.routePolylines.forEach(poly => map.removeLayer(poly));
    }
    appState.routePolylines = []; // Reset array

    // 2. Loop semua rute yang dikasih API
    paths.forEach((path, index) => {
        const coordinates = decodePolyline(path.points);
        const isMainRoute = index === 0; // Rute pertama dianggap rute utama

        // Style untuk rute Utama vs Alternatif
        const routeStyle = isMainRoute ? {
            color: '#1A73E8',     // Biru terang
            weight: 7,            // Lebih tebal
            opacity: 0.9
        } : {
            color: '#9AA0A6',     // Abu-abu
            weight: 6,            // Sedikit tebal agar mudah diklik
            opacity: 0.7,
            dashArray: '10, 10'   // Putus-putus
        };

        // Gambar Garis
        const polyline = L.polyline(coordinates, routeStyle).addTo(map);
        
        // Tambahkan data path ke object polyline biar bisa diakses saat diklik
        polyline.routeData = path; 

        // 3. Event Listener: Saat rute alternatif diklik, jadikan utama
        polyline.on('click', function(e) {
            // Reset style semua rute jadi abu-abu
            appState.routePolylines.forEach(p => {
                p.setStyle({ color: '#9AA0A6', weight: 6, opacity: 0.7, dashArray: '10, 10' });
            });

            // Set style rute yang diklik jadi biru (aktif) dan taruh di paling atas
            this.setStyle({ color: '#1A73E8', weight: 7, opacity: 0.9, dashArray: null });
            this.bringToFront(); 

            // Update Info Panel (Jarak & Waktu) sesuai rute yang dipilih
            displayRouteSummary(this.routeData);
            
            // Simpan rute aktif ke state
            appState.routeData = this.routeData;
            
            // Tampilkan direction list yang sesuai
            if (document.getElementById('directionsContainer').classList.contains('show')) {
                 displayDirections(this.routeData.instructions);
            }
        });
        
        // Simpan ke array state
        appState.routePolylines.push(polyline);
    });

    // 4. Fokuskan peta ke rute utama dan pastikan rute utama ada di paling atas
    if (appState.routePolylines.length > 0) {
        const mainRoute = appState.routePolylines[0];
        mainRoute.bringToFront(); // Pastikan rute utama di layer paling atas
        map.fitBounds(mainRoute.getBounds(), { padding: [50, 50] });
        
        // Tampilkan info rute utama di panel
        displayRouteSummary(paths[0]);
        appState.routeData = paths[0];
        
        // Munculkan tombol navigasi
        document.getElementById('directionsBtn').style.display = 'flex';
    }
}

function displayRouteSummary(path) {
    const distance = path.distance;
    const duration = path.time;

    const distanceKm = (distance / 1000).toFixed(1);
    const durationMin = Math.round(duration / 1000 / 60);
    const hours = Math.floor(durationMin / 60);
    const minutes = durationMin % 60;

    let timeText = '';
    if (hours > 0) {
        timeText = `${hours} jam ${minutes} menit`;
    } else {
        timeText = `${minutes} menit`;
    }

    document.getElementById('summaryTime').textContent = timeText;
    document.getElementById('summaryDistance').textContent = `${distanceKm} km`;
    document.getElementById('summaryKm').textContent = distanceKm;

    // Calculate ETA
    const now = new Date();
    const eta = new Date(now.getTime() + duration);
    document.getElementById('summaryEta').textContent =
        eta.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    document.getElementById('routeSummary').classList.add('show');
}

// Decode GraphHopper polyline
function decodePolyline(encoded) {
    const coords = [];
    let index = 0, len = encoded.length;
    let lat = 0, lng = 0;

    while (index < len) {
        let b, shift = 0, result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;
        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);
        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        coords.push([lat / 1e5, lng / 1e5]);
    }

    return coords;
}

// ================================================
// ROUTING - DIRECTIONS
// ================================================

function toggleDirections() {
    const container = document.getElementById('directionsContainer');
    container.classList.toggle('show');

    if (container.classList.contains('show') && appState.routeData) {
        displayDirections(appState.routeData.instructions);
    }
}

function displayDirections(instructions) {
    const container = document.getElementById('directionsContainer');
    container.innerHTML = '';

    instructions.forEach((instruction, index) => {
        const div = document.createElement('div');
        div.className = 'direction-step';

        const icon = getInstructionIcon(instruction.sign);
        const distance = instruction.distance < 1000
            ? `${Math.round(instruction.distance)} m`
            : `${(instruction.distance / 1000).toFixed(1)} km`;

        div.innerHTML = `
            <div class="step-icon">
                <i class="${icon}"></i>
            </div>
            <div class="step-content">
                <div class="step-instruction">${instruction.text}</div>
                <div class="step-distance">${distance}</div>
            </div>
        `;

        container.appendChild(div);
    });
}

function getInstructionIcon(sign) {
    const icons = {
        '-7': 'ri-arrow-left-line',
        '-3': 'ri-arrow-left-line',
        '-2': 'ri-arrow-left-line',
        '-1': 'ri-arrow-left-line',
        0: 'ri-arrow-up-line',
        1: 'ri-arrow-right-line',
        2: 'ri-arrow-right-line',
        3: 'ri-arrow-right-line',
        4: 'ri-checkbox-blank-circle-fill',
        5: 'ri-checkbox-blank-circle-fill',
        6: 'ri-arrow-right-up-line',
        7: 'ri-arrow-right-down-line'
    };
    return icons[sign] || 'ri-arrow-up-line';
}

// ================================================
// UI FUNCTIONS
// ================================================

function openRoutingPanel() {
    document.getElementById('searchContainer').style.display = 'none';
    document.getElementById('routingPanel').classList.add('active');
    document.getElementById('startInput').focus();
}

function closeRoutingPanel() {
    document.getElementById('routingPanel').classList.remove('active');
    document.getElementById('searchContainer').style.display = 'block';

    // Clear route (Modified for array)
    if (appState.routePolylines) {
        appState.routePolylines.forEach(poly => map.removeLayer(poly));
        appState.routePolylines = [];
    }

    // Reset inputs
    document.getElementById('startInput').value = '';
    document.getElementById('endInput').value = '';
    document.getElementById('routeSummary').classList.remove('show');
    document.getElementById('directionsContainer').classList.remove('show');
    document.getElementById('directionsBtn').style.display = 'none';

    // Clear suggestions
    document.querySelectorAll('.suggestions-list').forEach(el => el.classList.remove('show'));

    appState.startCoords = null;
    appState.endCoords = null;
    appState.routeData = null;
}

function setDestination(name, lat, lon) {
    openRoutingPanel();
    document.getElementById('endInput').value = name;
    document.getElementById('endInput').dataset.lat = lat;
    document.getElementById('endInput').dataset.lon = lon;
    appState.endCoords = { lat, lon };
    updateEndMarker(lat, lon);

    if (!appState.startCoords) {
        useCurrentLocation();
    }
}

function useCurrentLocation() {
    if (navigator.geolocation) {
        const startInput = document.getElementById('startInput');
        startInput.value = 'Mencari lokasi...';

        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                startInput.value = 'Lokasi Saya';
                startInput.dataset.lat = lat;
                startInput.dataset.lon = lon;
                appState.startCoords = { lat, lon };

                updateUserLocationMarker(lat, lon);
                updateStartMarker(lat, lon);
            },
            error => {
                console.error('Geolocation error:', error);
                startInput.value = '';
                alert('❌ Tidak dapat mengakses lokasi Anda. Pastikan GPS aktif dan izin lokasi diberikan.');
            }
        );
    } else {
        alert('❌ Browser Anda tidak mendukung geolocation');
    }
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                appState.startCoords = { lat, lon };
                updateUserLocationMarker(lat, lon);

                console.log(`📍 User location: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            },
            error => {
                console.warn('⚠️ Could not get user location:', error.message);
            }
        );
    }
}

function clearDestination() {
    const input = document.getElementById('endInput');
    input.value = '';
    delete input.dataset.lat;
    delete input.dataset.lon;
    appState.endCoords = null;

    if (appState.endMarker) {
        map.removeLayer(appState.endMarker);
        appState.endMarker = null;
    }
}

function swapLocations() {
    const startInput = document.getElementById('startInput');
    const endInput = document.getElementById('endInput');

    // Swap values
    const tempValue = startInput.value;
    const tempLat = startInput.dataset.lat;
    const tempLon = startInput.dataset.lon;

    startInput.value = endInput.value;
    startInput.dataset.lat = endInput.dataset.lat || '';
    startInput.dataset.lon = endInput.dataset.lon || '';

    endInput.value = tempValue;
    endInput.dataset.lat = tempLat || '';
    endInput.dataset.lon = tempLon || '';

    // Swap coordinates
    const tempCoords = appState.startCoords;
    appState.startCoords = appState.endCoords;
    appState.endCoords = tempCoords;

    // Update markers
    if (appState.startCoords) {
        updateStartMarker(appState.startCoords.lat, appState.startCoords.lon);
    } else if (appState.startMarker) {
        map.removeLayer(appState.startMarker);
        appState.startMarker = null;
    }

    if (appState.endCoords) {
        updateEndMarker(appState.endCoords.lat, appState.endCoords.lon);
    } else if (appState.endMarker) {
        map.removeLayer(appState.endMarker);
        appState.endMarker = null;
    }

    console.log('🔄 Locations swapped');
}

function selectMode(mode) {
    appState.selectedMode = mode;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');

    // Recalculate route if exists
    if (appState.routeData) {
        calculateRoute();
    }

    console.log(`🚗 Transport mode: ${mode}`);
}

// ================================================
// MAP CONTROLS
// ================================================

function toggleLayerMenu() {
    document.getElementById('layerMenu').classList.toggle('show');
}

function changeLayer(type) {
    // 1. Ganti Tile Layer Peta
    map.eachLayer(layer => {
        if (layer instanceof L.TileLayer) {
            map.removeLayer(layer);
        }
    });
    map.addLayer(mapLayers[type]);

    // 2. Update Tampilan Menu (Active State)
    document.querySelectorAll('.layer-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Cari elemen menu yang sesuai tipe dan tambahkan class active
    const selectedOption = document.querySelector(`.layer-option[onclick="changeLayer('${type}')"]`);
    if (selectedOption) {
        selectedOption.classList.add('active');
    }

    // 3. LOGIKA BARU: Update Ikon pada Tombol Utama (Bulat)
    const mainBtnIcon = document.querySelector('.layer-btn i');
    
    // Daftar ikon yang sesuai dengan setiap layer
    const layerIcons = {
        'default': 'ri-map-fill',       // Ikon Peta (Default)
        'satellite': 'ri-earth-fill',   // Ikon Globe (Satelit)
        'dark': 'ri-moon-fill'          // Ikon Bulan (Gelap)
    };

    // Ganti class ikon pada tombol utama
    if (mainBtnIcon && layerIcons[type]) {
        // Reset class lama, lalu pasang class baru
        mainBtnIcon.className = layerIcons[type];
        
        // Opsional: Tambahkan efek animasi kecil agar terlihat responsif
        mainBtnIcon.style.transform = 'scale(0.5)';
        setTimeout(() => {
            mainBtnIcon.style.transform = 'scale(1)';
        }, 150);
    }

    // 4. Tutup Menu Layer
    document.getElementById('layerMenu').classList.remove('show');

    console.log(`🗺️ Map layer changed to: ${type}`);
}

function zoomIn() {
    map.zoomIn();
}

function zoomOut() {
    map.zoomOut();
}

function recenterMap() {
    if (appState.userLocationMarker) {
        map.flyTo(appState.userLocationMarker.getLatLng(), 15, {
            duration: 1
        });
    } else {
        getUserLocation();
        setTimeout(() => {
            if (appState.userLocationMarker) {
                map.flyTo(appState.userLocationMarker.getLatLng(), 15, {
                    duration: 1
                });
            }
        }, 1000);
    }
}

// ================================================
// FULLSCREEN CONTROL
// ================================================

function toggleFullscreen() {
    const elem = document.documentElement; // Mengambil elemen root (seluruh halaman)
    const icon = document.getElementById('fullscreenIcon');

    if (!document.fullscreenElement) {
        // Masuk ke Mode Fullscreen
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else if (elem.webkitRequestFullscreen) { /* Safari */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }
    } else {
        // Keluar dari Mode Fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) { /* Safari */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE11 */
            document.msExitFullscreen();
        }
    }
}

// Event Listener untuk memantau perubahan status fullscreen
document.addEventListener('fullscreenchange', updateFullscreenIcon);
document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
document.addEventListener('mozfullscreenchange', updateFullscreenIcon);
document.addEventListener('MSFullscreenChange', updateFullscreenIcon);

function updateFullscreenIcon() {
    const icon = document.getElementById('fullscreenIcon');
    if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        icon.className = 'ri-fullscreen-exit-line';
    } else {
        icon.className = 'ri-fullscreen-line';
    }
}

// ================================================
// DEBUG FUNCTIONS
// ================================================

let debugEnabled = false;

function toggleDebug() {
    debugEnabled = !debugEnabled;
    const panel = document.getElementById('debugPanel');
    
    if (debugEnabled) {
        panel.classList.add('show');
        updateDebugInfo();
        
        // Update every 2 seconds
        if (!window.debugInterval) {
            window.debugInterval = setInterval(updateDebugInfo, 2000);
        }
    } else {
        panel.classList.remove('show');
        if (window.debugInterval) {
            clearInterval(window.debugInterval);
            window.debugInterval = null;
        }
    }
}

function updateDebugInfo() {
    const info = document.getElementById('debugInfo');
    const totalMarkers = Object.values(touristData).reduce((sum, arr) => sum + arr.length, 0);
    const hasRoute = appState.routePolylines && appState.routePolylines.length > 0;
    const hasUserLocation = appState.userLocationMarker !== null;

    info.innerHTML = `
        <div class="debug-item ${map ? 'debug-ok' : 'debug-error'}">
            Map: ${map ? '✓ Active' : '✗ Error'}
        </div>
        <div class="debug-item">
            Center: [${map.getCenter().lat.toFixed(4)}, ${map.getCenter().lng.toFixed(4)}]
        </div>
        <div class="debug-item">
            Zoom: ${map.getZoom()}
        </div>
        <div class="debug-item ${totalMarkers > 0 ? 'debug-ok' : 'debug-warn'}">
            Total Markers: ${totalMarkers}
        </div>
        <div class="debug-item">
            └─ Nature: ${touristData.nature.length}
        </div>
        <div class="debug-item">
            └─ Culture: ${touristData.culture.length}
        </div>
        <div class="debug-item">
            └─ Culinary: ${touristData.culinary.length}
        </div>
        <div class="debug-item">
            └─ Recreation: ${touristData.recreation.length}
        </div>
        <div class="debug-item">
            Category Filter: ${appState.currentCategory}
        </div>
        <div class="debug-item ${hasUserLocation ? 'debug-ok' : 'debug-warn'}">
            User Location: ${hasUserLocation ? '✓ Active' : '○ Not set'}
        </div>
        <div class="debug-item ${appState.startCoords ? 'debug-ok' : 'debug-warn'}">
            Start Point: ${appState.startCoords ? '✓ Set' : '○ Not set'}
        </div>
        <div class="debug-item ${appState.endCoords ? 'debug-ok' : 'debug-warn'}">
            End Point: ${appState.endCoords ? '✓ Set' : '○ Not set'}
        </div>
        <div class="debug-item ${hasRoute ? 'debug-ok' : 'debug-warn'}">
            Active Route: ${hasRoute ? '✓ Yes' : '○ No'}
        </div>
        <div class="debug-item">
            Transport Mode: ${appState.selectedMode}
        </div>
        <div class="debug-item ${CONFIG.GRAPHHOPPER_API_KEY ? 'debug-ok' : 'debug-error'}">
            GraphHopper API: ${CONFIG.GRAPHHOPPER_API_KEY ? '✓ Set' : '✗ Missing'}
        </div>
    `;
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    } else {
        return `${(meters / 1000).toFixed(1)} km`;
    }
}

function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
        return `${hours} jam ${remainingMinutes} menit`;
    } else {
        return `${minutes} menit`;
    }
}

// ================================================
// INITIALIZATION CALL
// ================================================

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// Console welcome message
console.log('%c╔═══════════════════════════════════════╗', 'color: #1A73E8');
console.log('%c║   🗺️  WebGIS Routing Application    ║', 'color: #1A73E8; font-weight: bold');
console.log('%c╚═══════════════════════════════════════╝', 'color: #1A73E8');
console.log('%c', '');
console.log('%c📍 Features:', 'font-weight: bold; color: #34A853');
console.log('%c   • GraphHopper Routing Engine', 'color: #666');
console.log('%c   • Multiple Transport Modes', 'color: #666');
console.log('%c   • Turn-by-Turn Navigation', 'color: #666');
console.log('%c   • Real-time Route Calculation', 'color: #666');
console.log('%c   • Category Filtering', 'color: #666');
console.log('%c   • Tourist Spot Search', 'color: #666');
console.log('%c', '');
console.log('%c⌨️  Keyboard Shortcuts:', 'font-weight: bold; color: #FBBC04');
console.log('%c   • Ctrl+D: Toggle Debug Panel', 'color: #666');
console.log('%c', '');
console.log('%c🔧 API Status:', 'font-weight: bold; color: #EA4335');
console.log('%c   • GraphHopper API: ' + (CONFIG.GRAPHHOPPER_API_KEY ? '✓ Connected' : '✗ Not configured'), 'color: ' + (CONFIG.GRAPHHOPPER_API_KEY ? '#34A853' : '#EA4335'));
console.log('%c', '');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #1A73E8');
// ================================================
// EXPOSE API FOR PARENT WINDOW (PENTING!)
// Taruh ini di baris PALING BAWAH file routing.js
// ================================================

window.WebGIS_API = {
    // Fungsi 1: Menerima pesanan pencarian dari index.html
    search: (query) => {
        // Memastikan data wisata sudah siap
        if (typeof touristData === 'undefined' || !touristData) {
            console.warn('Data wisata belum dimuat sepenuhnya.');
            return [];
        }
        // Memanggil fungsi pencarian yang sudah ada
        return searchTouristSpots(query);
    },

    // Fungsi 2: Terbang ke lokasi saat diklik
    flyToLocation: (lat, lon) => {
        if (!map) return;
        
        map.flyTo([lat, lon], 17, { duration: 1.5 });

        // Tunggu sebentar lalu buka popup
        setTimeout(() => {
            appState.markerCluster.eachLayer(layer => {
                const latLng = layer.getLatLng();
                // Cocokkan koordinat
                if (Math.abs(latLng.lat - lat) < 0.00001 && Math.abs(latLng.lng - lon) < 0.00001) {
                    appState.markerCluster.zoomToShowLayer(layer, () => {
                        layer.openPopup();
                    });
                }
            });
        }, 800);
    }
};

console.log('✅ WebGIS External API is READY!');