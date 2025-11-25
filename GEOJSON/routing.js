/* HTML/routing.js */

const BANDUNG_LAT = -6.9175; 
const BANDUNG_LON = 107.6191; 

// === 1. DEFINISI LAYER PETA ===
const layers = {
    default: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '© CARTO', maxZoom: 20 }),
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { attribution: '© Esri', maxZoom: 19 }),
    dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '© CARTO', maxZoom: 20 })
};

// === 2. INIT MAP ===
const map = L.map('map', { 
    zoomControl: false, 
    fullscreenControl: true,
    fullscreenControlOptions: { position: 'bottomleft' }, 
    layers: [layers.default] 
}).setView([BANDUNG_LAT, BANDUNG_LON], 13); 

L.control.zoom({ position: 'bottomright' }).addTo(map);

// Variables
let routingControl = null;
let userMarker = null;

// === 3. EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
    // Inputs
    document.getElementById('globalSearch').addEventListener('input', (e) => searchNominatim(e.target.value, 'globalSuggestions', 'globalSearch'));
    document.getElementById('startLocation').addEventListener('input', (e) => searchNominatim(e.target.value, 'startSuggestions', 'startLocation'));
    document.getElementById('endLocation').addEventListener('input', (e) => searchNominatim(e.target.value, 'endSuggestions', 'endLocation'));
    
    // Buttons
    document.getElementById('closeRoutingBtn').addEventListener('click', closeRoutingMode);
    document.getElementById('useMyLocationBtn').addEventListener('click', useMyLocation);
    document.getElementById('clearDestinationBtn').addEventListener('click', clearDestination);
    document.getElementById('swapBtn').addEventListener('click', swapLocations); // EVENT SWAP DITAMBAHKAN
    document.getElementById('routeBtn').addEventListener('click', calculateRoute);
    document.getElementById('directionsToggle').addEventListener('click', toggleDirectionsPanel);

    // Klik luar
    document.addEventListener('click', (e) => {
        if(!e.target.closest('.simple-search-container') && !e.target.closest('.routing-panel')) {
            document.querySelectorAll('.suggestions-box').forEach(el => el.style.display = 'none');
        }
        if(!e.target.closest('.layer-fab-container')) {
            document.getElementById('layerMenu').classList.remove('show');
        }
    });

    // Detect User Location (Silent)
    navigator.geolocation.getCurrentPosition(pos => {});
});

// === 4. LOGIC FUNGSI ===

// SWAP (TUKAR) LOKASI
function swapLocations() {
    const startInput = document.getElementById('startLocation');
    const endInput = document.getElementById('endLocation');

    // Tukar Value Text
    const tempVal = startInput.value;
    startInput.value = endInput.value;
    endInput.value = tempVal;

    // Tukar Data Koordinat
    const tempLat = startInput.dataset.lat;
    const tempLon = startInput.dataset.lon;
    
    if(endInput.dataset.lat) {
        startInput.dataset.lat = endInput.dataset.lat;
        startInput.dataset.lon = endInput.dataset.lon;
    } else {
        delete startInput.dataset.lat;
        delete startInput.dataset.lon;
    }

    if(tempLat) {
        endInput.dataset.lat = tempLat;
        endInput.dataset.lon = tempLon;
    } else {
        delete endInput.dataset.lat;
        delete endInput.dataset.lon;
    }
}

function toggleLayerMenu() {
    document.getElementById('layerMenu').classList.toggle('show');
}

function changeLayer(type, element) {
    map.eachLayer((layer) => { if (layer instanceof L.TileLayer) map.removeLayer(layer); });
    map.addLayer(layers[type]);
    document.querySelectorAll('.layer-card').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    
    if(type === 'dark' || type === 'satellite') {
        document.querySelector('.simple-search-container').style.background = 'rgba(255,255,255,0.9)';
    } else {
        document.querySelector('.simple-search-container').style.background = '#fff';
    }
}

function recenterMap() {
    const btn = document.querySelector('.recenter-btn i');
    btn.classList.add('ri-spin'); 

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            
            map.flyTo([lat, lon], 16);
            
            if(userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([lat, lon], {
                icon: L.divIcon({ 
                    className: 'user-marker-pulse', 
                    iconSize: [20, 20], iconAnchor: [10, 10]
                })
            }).addTo(map);

            btn.classList.remove('ri-spin');
        }, () => {
            alert("Gagal mendeteksi lokasi.");
            btn.classList.remove('ri-spin');
        });
    }
}

function useMyLocation() {
    const input = document.getElementById('startLocation');
    input.placeholder = "Mencari...";
    recenterMap(); 
    
    navigator.geolocation.getCurrentPosition(pos => {
        input.value = "Lokasi Saya Saat Ini";
        input.dataset.lat = pos.coords.latitude;
        input.dataset.lon = pos.coords.longitude;
    });
}

// Navigasi UI
window.openNavPanel = function() {
    document.getElementById('simpleSearchContainer').style.display = 'none';
    document.getElementById('routingPanel').style.display = 'flex';
    document.getElementById('startLocation').focus();
}

window.openRoutingMode = function(destinationName, lat, lon) {
    document.getElementById('simpleSearchContainer').style.display = 'none';
    document.getElementById('routingPanel').style.display = 'flex';
    const endInput = document.getElementById('endLocation');
    endInput.value = destinationName || '';
    if(lat && lon) { endInput.dataset.lat = lat; endInput.dataset.lon = lon; }
    
    if (!document.getElementById('startLocation').dataset.lat) {
        useMyLocation(); 
    }
}

function closeRoutingMode() {
    document.getElementById('routingPanel').style.display = 'none';
    document.getElementById('simpleSearchContainer').style.display = 'flex';
}

function clearDestination() {
    const input = document.getElementById('endLocation');
    input.value = ''; delete input.dataset.lat; delete input.dataset.lon;
}

function calculateRoute() {
    const sLat = document.getElementById('startLocation').dataset.lat;
    const sLon = document.getElementById('startLocation').dataset.lon;
    const eLat = document.getElementById('endLocation').dataset.lat;
    const eLon = document.getElementById('endLocation').dataset.lon;
    if(!sLat || !eLat) return alert("Mohon lengkapi titik awal dan tujuan.");

    if(routingControl) map.removeControl(routingControl);

    const mode = document.querySelector('input[name="vehicle"]:checked').value;
    const profile = mode === 'foot' ? 'walking' : 'driving';

    routingControl = L.Routing.control({
        waypoints: [ L.latLng(sLat, sLon), L.latLng(eLat, eLon) ],
        router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1', profile: profile }),
        lineOptions: { styles: [{ color: '#6366F1', opacity: 0.8, weight: 6 }] },
        createMarker: () => null,
        addWaypoints: false, fitSelectedRoutes: true, showAlternatives: false,
        containerClassName: 'leaflet-routing-container'
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const instructions = routes[0].instructions;
        document.getElementById('directionsToggle').style.display = 'flex';
        let html = '<table>';
        instructions.forEach(step => {
            html += `<tr><td>${step.distance < 1000 ? Math.round(step.distance) + ' m' : (step.distance/1000).toFixed(1) + ' km'}</td><td>${step.text}</td></tr>`;
        });
        html += '</table>';
        document.getElementById('directionsPanel').innerHTML = html;
    });
}

function toggleDirectionsPanel() {
    document.getElementById('directionsPanel').classList.toggle('show');
}

// Search & Data
async function searchNominatim(query, containerId, inputId) {
    if(query.length < 3) return;
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}+Bandung&limit=5`);
    const data = await res.json();
    const container = document.getElementById(containerId);
    container.innerHTML = ''; container.style.display = 'block';
    
    data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerText = item.display_name.split(',')[0];
        div.onclick = () => {
            const input = document.getElementById(inputId);
            input.value = item.display_name.split(',')[0];
            input.dataset.lat = item.lat; input.dataset.lon = item.lon;
            container.style.display = 'none';
            if(inputId === 'globalSearch') window.openRoutingMode(item.display_name.split(',')[0], item.lat, item.lon);
        };
        container.appendChild(div);
    });
}

function createCleanIcon(type) {
    let colorClass = `marker-${type}`;
    let iconHtml = type === 'nature' ? '<i class="ri-leaf-fill"></i>' : type === 'culinary' ? '<i class="ri-restaurant-2-fill"></i>' : type === 'history' ? '<i class="ri-ancient-pavilion-fill"></i>' : '<i class="ri-emotion-happy-fill"></i>';
    return L.divIcon({ className: 'custom-div-icon', html: `<div class="clean-marker ${colorClass}" style="width:36px; height:36px;">${iconHtml}</div>`, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18] });
}

function createPopupContent(feature, layer) {
    if (feature.properties && feature.properties.Nama) {
        const safeName = feature.properties.Nama.replace(/'/g, "\\'");
        const popupContent = `
        <div style="font-family: 'Inter', sans-serif;">
            <div style="height:120px; overflow:hidden; border-radius:8px; background:#f0f0f0;">
               <img src="${feature.properties.gambar}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://via.placeholder.com/240x100?text=No+Image'">
            </div>
            <div style="padding-top: 10px;">
                <h3 style="margin:0 0 4px 0; font-size:14px; font-weight:700;">${feature.properties.Nama}</h3>
                <p style="font-size:11px; color:#666; margin-bottom: 8px;"><i class="ri-map-pin-line"></i> ${feature.properties.Kecamatan}</p>
                <button onclick="window.initRoutingFromPopup(${feature.geometry.coordinates[1]}, ${feature.geometry.coordinates[0]}, '${safeName}')"
                    style="width:100%; padding:8px; background:var(--primary); color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; gap:5px;">
                    <i class="ri-direction-line"></i> Rute ke Sini
                </button>
            </div>
        </div>`;
        layer.bindPopup(popupContent);
    }
}

window.initRoutingFromPopup = function(lat, lon, name) { window.openRoutingMode(name, lat, lon); };

function loadLayer(path, type) {
    fetch(path).then(r => r.json()).then(data => {
        L.geoJSON(data, {
            pointToLayer: (feature, latlng) => L.marker(latlng, { icon: createCleanIcon(type) }),
            onEachFeature: createPopupContent
        }).addTo(map);
    });
}

// Load Data
loadLayer('../GEOJSON/LokasiWisataAlamBandung.json', 'nature');
loadLayer('../GEOJSON/LokasiWisataBudayaBandung.json', 'history');
loadLayer('../GEOJSON/LokasiWisataKulinerBandung.json', 'culinary');
loadLayer('../GEOJSON/LokasiWisataRekreasiBandung.json', 'recreation');