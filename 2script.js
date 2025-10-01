// Global variables
let map
let fullscreenMap
let currentTheme = "default"
let markers = []
let currentRoute = null
const routingControl = null
let selectedLocation = null
let userLocation = null
let currentStep = 1
let selectedDestination = null
let bookingData = {}
const paymentHistory = [
  {
    id: "BWG001234",
    destination: "Kawah Putih",
    date: "2024-12-15",
    quantity: 2,
    total: 50000,
    status: "completed",
    bookerName: "Ahmad Rizki",
  },
  {
    id: "BWG001235",
    destination: "Trans Studio Bandung",
    date: "2024-12-20",
    quantity: 1,
    total: 50000,
    status: "pending",
    bookerName: "Sari Dewi",
  },
  {
    id: "BWG001233",
    destination: "Museum Geologi",
    date: "2024-12-10",
    quantity: 3,
    total: 45000,
    status: "completed",
    bookerName: "Budi Santoso",
  },
]

let currentUser = null
let isLoggedIn = false
let authModalType = "login"

// Import Leaflet library
const L = window.L

// Sample location data
const locations = [
  {
    id: 1,
    name: "Kawah Putih",
    category: "alam",
    lat: -7.166,
    lng: 107.402,
    rating: 4.5,
    reviewCount: 234,
    image: "public/kawah-putih-crater-lake.jpg",
    images: ["public/kawah-putih-crater-lake.jpg", "/kawah-putih-view-2.jpg", "/kawah-putih-landscape.jpg"],
    description:
      "Danau kawah vulkanik yang menakjubkan dengan air berwarna putih kehijauan. Terletak di ketinggian 2.434 meter di atas permukaan laut, kawah ini menawarkan pemandangan yang spektakuler dan udara yang sejuk.",
    address: "Ciwidey, Kabupaten Bandung",
    hours: "08:00 - 17:00",
    contact: "+62 22 5891234",
    price: "Rp 25.000",
    facilities: ["Parkir", "Toilet", "Warung", "Spot Foto"],
  },
  {
    id: 2,
    name: "Gedung Sate",
    category: "budaya",
    lat: -6.902,
    lng: 107.619,
    rating: 4.3,
    reviewCount: 189,
    image: "public/gedung-sate-bandung-architecture.jpg",
    images: ["public/gedung-sate-bandung-architecture.jpg", "/gedung-sate-interior.jpg", "/gedung-sate-history.jpg"],
    description:
      "Bangunan bersejarah yang menjadi ikon Kota Bandung. Dibangun pada tahun 1920, gedung ini merupakan kantor gubernur Jawa Barat dan memiliki arsitektur yang unik dengan menara yang menyerupai tusuk sate.",
    address: "Jl. Diponegoro No.22, Citarum",
    hours: "08:00 - 16:00",
    contact: "+62 22 4264813",
    price: "Gratis",
    facilities: ["Parkir", "Museum", "Taman", "Tur Gratis"],
  },
  {
    id: 3,
    name: "Trans Studio Bandung",
    category: "rekreasi",
    lat: -6.973,
    lng: 107.63,
    rating: 4.4,
    reviewCount: 345,
    image: "public/trans-studio-bandung-theme-park.jpg",
    images: ["public/trans-studio-bandung-theme-park.jpg", "/placeholder.svg?key=9j2xq", "/placeholder.svg?key=4j8zq"],
    description: "Taman hiburan indoor terbesar di Indonesia.",
    address: "Jl. Gatot Subroto No.289",
    hours: "10:00 - 22:00",
    contact: "+62 22 87242000",
    price: "Rp 50.000",
    facilities: ["Parkir", "Restoran", "Game Corner", "Showroom"],
  },
  {
    id: 4,
    name: "Jalan Braga",
    category: "kuliner",
    lat: -6.917,
    lng: 107.609,
    rating: 4.2,
    reviewCount: 456,
    image: "public/jalan-braga-bandung-street-food.jpg",
    images: ["public/jalan-braga-bandung-street-food.jpg", "/placeholder.svg?key=5j2xq", "/placeholder.svg?key=6j8zq"],
    description: "Jalan bersejarah dengan berbagai kuliner khas Bandung.",
    address: "Jl. Braga, Sumur Bandung",
    hours: "24 jam",
    contact: "-",
    price: "Rp 10.000",
    facilities: ["Parkir", "Warung", "Kafe", "Spot Foto"],
  },
  {
    id: 5,
    name: "Tangkuban Perahu",
    category: "alam",
    lat: -6.76,
    lng: 107.609,
    rating: 4.6,
    reviewCount: 567,
    image: "public/tangkuban-perahu-volcano-crater.jpg",
    images: ["public/tangkuban-perahu-volcano-crater.jpg", "/placeholder.svg?key=7j2xq", "/placeholder.svg?key=8j8zq"],
    description: "Gunung berapi aktif dengan kawah yang spektakuler.",
    address: "Cikole, Lembang",
    hours: "08:00 - 17:00",
    contact: "+62 22 2786482",
    price: "Rp 30.000",
    facilities: ["Parkir", "Toilet", "Warung", "Spot Foto"],
  },
  {
    id: 6,
    name: "Museum Geologi",
    category: "budaya",
    lat: -6.9,
    lng: 107.621,
    rating: 4.1,
    reviewCount: 678,
    image: "public/museum-geologi-bandung-fossils.jpg",
    images: ["public/museum-geologi-bandung-fossils.jpg", "/placeholder.svg?key=9j2xq", "/placeholder.svg?key=0j8zq"],
    description: "Museum yang menampilkan koleksi geologi Indonesia.",
    address: "Jl. Diponegoro No.57",
    hours: "08:00 - 16:00",
    contact: "+62 22 7213822",
    price: "Rp 15.000",
    facilities: ["Parkir", "Museum", "Taman", "Warung"],
  },
]

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] Initializing WebGIS application...")
  initializeMap()
  initializeEventListeners()
  initializeAnimations()
  initializeAuth()
  console.log("[v0] Application initialized successfully!")
})

// Initialize map
function initializeMap() {
  console.log("[v0] Initializing map...")
  try {
    // Main map
    map = L.map("map").setView([-6.917, 107.619], 11)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    // Add custom dark style
    map.getContainer().style.filter = "invert(1) hue-rotate(180deg)"
    
    // TAMBAHKAN: Inisialisasi Routing Control
    initializeRouting(map)

    // Add markers
    addMarkersToMap(map)
    console.log("[v0] Map initialized successfully!")
  } catch (error) {
    console.error("[v0] Error initializing map:", error)
  }
}

// Add markers to map
function addMarkersToMap(mapInstance) {
  markers.forEach((marker) => mapInstance.removeLayer(marker))
  markers = []

  locations.forEach((location) => {
    const icon = L.divIcon({
      className: "custom-marker",
      html: `<div class="marker-icon ${location.category}">${getCategoryIcon(location.category)}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    const marker = L.marker([location.lat, location.lng], { icon })
      .addTo(mapInstance)
      .on("click", () => showLocationDetails(location))

    markers.push(marker)
  })
}

// Get category icon
function getCategoryIcon(category) {
  const icons = {
    alam: "🌿",
    budaya: "🏛️",
    rekreasi: "🎢",
    kuliner: "🍜",
  }
  return icons[category] || "📍"
}

// Show location details
function showLocationDetails(location) {
  console.log("[v0] Showing enhanced location details for:", location.name)
  selectedLocation = location
  const panel = document.getElementById("location-panel")

  const imageElement = document.getElementById("location-image")
  imageElement.src = location.image
  imageElement.onerror = function () {
    console.log("[v0] Image failed to load, using themed placeholder")
    const themeColor = getThemeColor(location.category)
    this.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'%3E%3Crect width='400' height='250' fill='${encodeURIComponent(themeColor)}'/%3E%3Ctext x='200' y='110' text-anchor='middle' dy='0.3em' font-family='Arial, sans-serif' font-size='18' fill='white'%3E${encodeURIComponent(location.name)}%3C/text%3E%3Ctext x='200' y='140' text-anchor='middle' dy='0.3em' font-family='Arial, sans-serif' font-size='14' fill='rgba(255,255,255,0.8)'%3E${encodeURIComponent(location.category.toUpperCase())}%3C/text%3E%3C/svg%3E`
  }

  document.getElementById("location-name").textContent = location.name
  document.getElementById("location-stars").textContent = "⭐".repeat(Math.floor(location.rating))
  document.getElementById("location-rating-text").textContent =
    `${location.rating} (${location.reviewCount || Math.floor(Math.random() * 500) + 100} ulasan)`
  document.getElementById("location-category").textContent =
    location.category.charAt(0).toUpperCase() + location.category.slice(1)
  document.getElementById("location-description").textContent = location.description
  document.getElementById("location-address").textContent = location.address
  document.getElementById("location-hours").textContent = location.hours
  document.getElementById("location-contact").textContent = location.contact
  document.getElementById("location-coordinates").textContent = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
  document.getElementById("location-price").textContent = location.price || "Hubungi kami"

  // Update destination input
  const destinationInput = document.getElementById("destination-input")
  if (destinationInput) {
    destinationInput.value = location.name
  }

  // Show floating route button
  const floatingBtn = document.getElementById("floating-route-btn")
  if (floatingBtn) {
    floatingBtn.style.display = "flex"
  }

  panel.classList.add("active")
}

// Close location panel
function closeLocationPanel() {
  document.getElementById("location-panel").classList.remove("active")
}

// Set theme based on category
function setTheme(category) {
  console.log(`[v0] Setting theme to: ${category}`)

  // Remove existing theme classes
  document.body.classList.remove("theme-alam", "theme-budaya", "theme-rekreasi", "theme-kuliner")

  // Add new theme class
  if (category !== "default") {
    document.body.classList.add(`theme-${category}`)
  }

  currentTheme = category

  // Update active category card with enhanced visual feedback
  document.querySelectorAll(".category-card").forEach((card) => {
    card.classList.remove("active")
    // Reset blur animations
    const blurBg = card.querySelector(".category-blur-bg")
    if (blurBg) {
      blurBg.style.animation = "none"
    }
  })

  if (category !== "default") {
    const activeCard = document.querySelector(`[data-category="${category}"]`)
    if (activeCard) {
      activeCard.classList.add("active")
      // Trigger special animation for active theme
      const blurBg = activeCard.querySelector(".category-blur-bg")
      if (blurBg) {
        blurBg.style.animation = "pulseBlur 2s ease-in-out infinite"
      }
    }
  }

  // Enhanced theme transition with visual feedback
  document.body.style.transition = "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"

  // Add temporary glow effect during transition
  if (category !== "default") {
    document.body.style.boxShadow = `inset 0 0 100px rgba(var(--primary-rgb, 99, 102, 241), 0.1)`
  } else {
    document.body.style.boxShadow = "none"
  }

  setTimeout(() => {
    document.body.style.transition = ""
    document.body.style.boxShadow = ""
  }, 800)

  // Update floating elements colors based on theme
  updateFloatingElements(category)
}

function updateFloatingElements(category) {
  const floatingElements = document.querySelectorAll(".floating-element")

  floatingElements.forEach((element, index) => {
    let color = "var(--primary)"

    switch (category) {
      case "alam":
        color = index % 2 === 0 ? "#10b981" : "#34d399"
        break
      case "budaya":
        color = index % 2 === 0 ? "#f59e0b" : "#fbbf24"
        break
      case "rekreasi":
        color = index % 2 === 0 ? "#3b82f6" : "#8b5cf6"
        break
      case "kuliner":
        color = index % 2 === 0 ? "#ef4444" : "#f97316"
        break
      default:
        color = "#6366f1"
    }

    element.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`
  })
}

function getThemeColor(category) {
  const colors = {
    alam: "#10b981",
    budaya: "#f59e0b",
    rekreasi: "#3b82f6",
    kuliner: "#ef4444",
  }
  return colors[category] || "#6366f1"
}

// Filter locations
function filterLocations(category) {
  const filteredLocations = category === "all" ? locations : locations.filter((loc) => loc.category === category)

  // Clear existing markers
  markers.forEach((marker) => map.removeLayer(marker))
  markers = []

  // Add filtered markers
  filteredLocations.forEach((location) => {
    const icon = L.divIcon({
      className: "custom-marker",
      html: `<div class="marker-icon ${location.category}">${getCategoryIcon(location.category)}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    const marker = L.marker([location.lat, location.lng], { icon })
      .addTo(map)
      .on("click", () => showLocationDetails(location))

    markers.push(marker)
  })

  // Update active filter button
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active")
  })
  document.querySelector(`[data-filter="${category}"]`).classList.add("active")
}

// Open fullscreen map
function openFullscreenMap() {
  console.log("[v0] Opening fullscreen map...")
  const modal = document.getElementById("fullscreen-modal")
  modal.classList.add("active")

  // Initialize fullscreen map if not already done
  if (!fullscreenMap) {
    setTimeout(() => {
      try {
        fullscreenMap = L.map("fullscreen-map").setView([-6.917, 107.619], 11)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(fullscreenMap)

        fullscreenMap.getContainer().style.filter = "invert(1) hue-rotate(180deg)"
        addMarkersToMap(fullscreenMap)
        console.log("[v0] Fullscreen map initialized successfully!")
      } catch (error) {
        console.error("[v0] Error initializing fullscreen map:", error)
      }
    }, 100)
  }
}

// Close fullscreen map
function closeFullscreenMap() {
  document.getElementById("fullscreen-modal").classList.remove("active")
}

// Show route
function showRoute() {
  alert("Fitur routing akan segera hadir! Silakan gunakan aplikasi navigasi favorit Anda.")
}

// Scroll to maps section
function scrollToMaps() {
  document.getElementById("maps").scrollIntoView({ behavior: "smooth" })
}

// Initialize event listeners
function initializeEventListeners() {
  console.log("[v0] Initializing enhanced event listeners...")

  // Navigation links
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const target = this.getAttribute("href")

      if (target === "#login") {
        if (isLoggedIn) {
          toggleProfileDropdown()
        } else {
          openAuthModal("login")
        }
        return
      }

      if (target.startsWith("#")) {
        const targetElement = document.querySelector(target)
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: "smooth" })
        }
      }

      // Update active nav link
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
      this.classList.add("active")
    })
  })

  // Filter buttons
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter")
      filterLocations(filter)
    })
  })

  // Fullscreen sidebar filters
  document.querySelectorAll(".sidebar-filter").forEach((btn) => {
    btn.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter")
      filterLocations(filter)

      // Update active sidebar filter
      document.querySelectorAll(".sidebar-filter").forEach((b) => b.classList.remove("active"))
      this.classList.add("active")
    })
  })

  // Search functionality
  const searchInputs = document.querySelectorAll(".search-input, .sidebar-search-input")
  searchInputs.forEach((input) => {
    input.addEventListener("input", function () {
      const query = this.value.toLowerCase()
      const filteredLocations = locations.filter(
        (loc) =>
          loc.name.toLowerCase().includes(query) ||
          loc.description.toLowerCase().includes(query) ||
          loc.category.toLowerCase().includes(query),
      )

      // Update markers based on search
      markers.forEach((marker) => map.removeLayer(marker))
      markers = []

      filteredLocations.forEach((location) => {
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div class="marker-icon ${location.category}">${getCategoryIcon(location.category)}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        })

        const marker = L.marker([location.lat, location.lng], { icon })
          .addTo(map)
          .on("click", () => showLocationDetails(location))

        markers.push(marker)
      })
    })
  })

  // Destination selection in payment modal
  document.addEventListener("change", (e) => {
    if (e.target.name === "destination") {
      selectDestinationOption(e.target.value)
    }

    if (e.target.name === "payment-method") {
      document.querySelectorAll(".payment-method").forEach((method) => {
        method.classList.remove("selected")
      })
      e.target.closest(".payment-method").classList.add("selected")
    }
  })

  // Quantity change listeners
  document.addEventListener("input", (e) => {
    if (e.target.id === "visitor-count") {
      updateBookingSummary()
    }
    if (e.target.id === "visit-date") {
      updateBookingSummary()
    }
  })

  // History filter buttons
  document.addEventListener("click", (e) => {
    if (e.target.matches(".history-filters .filter-btn")) {
      document.querySelectorAll(".history-filters .filter-btn").forEach((btn) => {
        btn.classList.remove("active")
      })
      e.target.classList.add("active")

      const filter = e.target.getAttribute("data-filter")
      updateHistoryDisplay(filter)
    }
  })

  // Close modal on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeFullscreenMap()
      closeLocationPanel()
      closeRoutingPanel()
      closePaymentModal()
      closePaymentHistory()
      closeAuthModal()
      closeSettingsModal()
    }
  })

  // Close modal on outside click
  const fullscreenModal = document.getElementById("fullscreen-modal")
  if (fullscreenModal) {
    fullscreenModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeFullscreenMap()
      }
    })
  }

  const paymentModal = document.getElementById("payment-modal")
  if (paymentModal) {
    paymentModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closePaymentModal()
      }
    })
  }

  const historyModal = document.getElementById("payment-history-modal")
  if (historyModal) {
    historyModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closePaymentHistory()
      }
    })
  }

  // Close routing panel when location panel is opened
  document.addEventListener("click", (e) => {
    if (e.target.closest(".location-panel") && !e.target.closest(".routing-panel")) {
      closeRoutingPanel()
    }
  })

  // Thumbnail gallery functionality
  document.addEventListener("click", (e) => {
    if (e.target.closest(".thumbnail")) {
      const thumbnail = e.target.closest(".thumbnail")
      const mainImage = document.getElementById("fullscreen-main-image")
      const img = thumbnail.querySelector("img")

      // Remove active class from all thumbnails
      document.querySelectorAll(".thumbnail").forEach((t) => t.classList.remove("active"))

      // Add active class to clicked thumbnail
      thumbnail.classList.add("active")

      // Update main image
      mainImage.src = img.src
    }
  })

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-profile-dropdown")) {
      document.getElementById("profile-dropdown-menu").classList.remove("active")
    }
  })

  const authModal = document.getElementById("auth-modal")
  if (authModal) {
    authModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeAuthModal()
      }
    })
  }

  const settingsModal = document.getElementById("settings-modal")
  if (settingsModal) {
    settingsModal.addEventListener("click", function (e) {
      if (e.target === this) {
        closeSettingsModal()
      }
    })
  }

  console.log("[v0] Enhanced event listeners with authentication system initialized successfully!")
}

// Initialize animations
function initializeAnimations() {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe elements for animation
  document.querySelectorAll(".category-card, .news-card, .team-card").forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(30px)"
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(el)
  })

  // Parallax effect for hero section
  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset
    const hero = document.querySelector(".hero-bg")
    if (hero) {
      hero.style.transform = `translateY(${scrolled * 0.5}px)`
    }
  })

  // Header background on scroll
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header")
    if (window.scrollY > 100) {
      header.style.background = "rgba(15, 15, 35, 0.95)"
    } else {
      header.style.background = "rgba(15, 15, 35, 0.8)"
    }
  })
}

// Add custom marker styles
const style = document.createElement("style")
style.textContent = `
    .custom-marker {
        background: none;
        border: none;
    }
    
    .marker-icon {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        border: 2px solid white;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .marker-icon:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }
    
    .marker-icon.alam {
        background: linear-gradient(135deg, #10b981, #34d399);
    }
    
    .marker-icon.budaya {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
    }
    
    .marker-icon.rekreasi {
        background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    }
    
    .marker-icon.kuliner {
        background: linear-gradient(135deg, #ef4444, #f97316);
    }
    
    .category-card.active {
        border-color: var(--primary);
        box-shadow: 0 20px 40px rgba(99, 102, 241, 0.4);
        transform: translateY(-10px);
    }
`
document.head.appendChild(style)

// Initialize theme system
setTheme("default")
console.log("[v0] Theme system initialized with enhanced animations")

function showRoutePanel() {
  if (!selectedLocation) {
    alert("Pilih destinasi terlebih dahulu!")
    return
  }

  const routingPanel = document.getElementById("routing-panel")
  const locationPanel = document.getElementById("location-panel")

  // Close location panel and open routing panel
  locationPanel.classList.remove("active")
  routingPanel.classList.add("active")

  // Set destination
  document.getElementById("destination-input").value = selectedLocation.name
}

function closeRoutingPanel() {
  document.getElementById("routing-panel").classList.remove("active")

  // Clear route if exists
  if (currentRoute && map.hasLayer(currentRoute)) {
    map.removeLayer(currentRoute)
    currentRoute = null
  }

  // Hide route results
  document.getElementById("route-results").style.display = "none"
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        document.getElementById("origin-input").value = "Lokasi Saya"
        console.log("[v0] User location obtained:", userLocation)
      },
      (error) => {
        console.error("[v0] Error getting location:", error)
        alert("Tidak dapat mengakses lokasi Anda. Silakan masukkan alamat secara manual.")
      },
    )
  } else {
    alert("Geolocation tidak didukung oleh browser Anda.")
  }
}

function swapLocations() {
  const originInput = document.getElementById("origin-input")
  const destinationInput = document.getElementById("destination-input")

  const temp = originInput.value
  originInput.value = destinationInput.value
  destinationInput.value = temp
}

function calculateRoute() {
  const originInput = document.getElementById("origin-input").value
  const destinationInput = document.getElementById("destination-input").value
  const transportMode = document.getElementById("transport-mode").value

  if (!originInput || !destinationInput) {
    alert("Harap isi titik asal dan tujuan!")
    return
  }

  console.log("[v0] Calculating route from", originInput, "to", destinationInput)

  // Simulate route calculation (in real app, use routing service)
  setTimeout(() => {
    const mockDistance = (Math.random() * 50 + 5).toFixed(1)
    const mockDuration = calculateMockDuration(mockDistance, transportMode)

    // Show results
    document.getElementById("route-distance").textContent = `${mockDistance} km`
    document.getElementById("route-duration").textContent = mockDuration
    document.getElementById("route-results").style.display = "block"

    // Generate mock route steps
    generateMockRouteSteps()

    // Draw route on map
    drawRouteOnMap()

    console.log("[v0] Route calculated successfully")
  }, 1500)
}

function calculateMockDuration(distance, mode) {
  const speeds = {
    driving: 40, // km/h
    walking: 5, // km/h
    cycling: 15, // km/h
  }

  const hours = Number.parseFloat(distance) / speeds[mode]

  if (hours < 1) {
    return `${Math.round(hours * 60)} menit`
  } else {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return m > 0 ? `${h} jam ${m} menit` : `${h} jam`
  }
}

function generateMockRouteSteps() {
  const steps = [
    "Mulai dari titik asal",
    "Belok kanan ke Jl. Raya Utama",
    "Lurus terus sejauh 2.5 km",
    "Belok kiri ke Jl. Bandung-Ciwidey",
    "Ikuti jalan utama sejauh 15 km",
    "Belok kanan menuju destinasi",
    "Tiba di tujuan",
  ]

  const stepsContainer = document.getElementById("route-steps")
  stepsContainer.innerHTML = ""

  steps.forEach((step, index) => {
    const stepElement = document.createElement("div")
    stepElement.className = "route-step"
    stepElement.innerHTML = `
      <div class="step-icon">${index + 1}</div>
      <div class="step-text">${step}</div>
    `
    stepsContainer.appendChild(stepElement)
  })
}

function drawRouteOnMap() {
  // Clear existing route
  if (currentRoute && map.hasLayer(currentRoute)) {
    map.removeLayer(currentRoute)
  }

  // Create mock route coordinates
  const origin = userLocation || { lat: -6.917, lng: 107.619 } // Default to Bandung center
  const destination = { lat: selectedLocation.lat, lng: selectedLocation.lng }

  // Create curved path between points
  const midLat = (origin.lat + destination.lat) / 2
  const midLng = (origin.lng + destination.lng) / 2
  const offset = 0.01 // Curve offset

  const routeCoords = [
    [origin.lat, origin.lng],
    [midLat + offset, midLng + offset],
    [destination.lat, destination.lng],
  ]

  // Draw route with animated dashed lines
  currentRoute = L.polyline(routeCoords, {
    color: "#3b82f6",
    weight: 4,
    opacity: 0.8,
    dashArray: "10, 10",
    className: "route-line",
  }).addTo(map)

  // Add origin and destination markers
  const originMarker = L.circleMarker([origin.lat, origin.lng], {
    color: "#ef4444",
    fillColor: "#ef4444",
    fillOpacity: 0.8,
    radius: 8,
  }).addTo(map)

  const destinationMarker = L.circleMarker([destination.lat, destination.lng], {
    color: "#3b82f6",
    fillColor: "#3b82f6",
    fillOpacity: 0.8,
    radius: 8,
  }).addTo(map)

  // Fit map to show entire route
  const group = new L.featureGroup([currentRoute, originMarker, destinationMarker])
  map.fitBounds(group.getBounds().pad(0.1))

  // Animate the route line
  animateRouteLine()
}

function animateRouteLine() {
  if (!currentRoute) return

  const pathElement = currentRoute.getElement()
  if (pathElement) {
    pathElement.style.strokeDasharray = "10, 10"
    pathElement.style.animation = "dashMove 2s linear infinite"
  }
}

function startNavigation() {
  alert(
    "Navigasi dimulai! Dalam aplikasi nyata, ini akan membuka aplikasi navigasi atau memberikan petunjuk turn-by-turn.",
  )
}

function showLocationFullscreen() {
  if (!selectedLocation) return

  const modal = document.getElementById("location-fullscreen-modal")
  modal.classList.add("active")

  // Populate fullscreen data
  document.getElementById("fullscreen-location-title").textContent = selectedLocation.name
  document.getElementById("fullscreen-location-name").textContent = selectedLocation.name
  document.getElementById("fullscreen-main-image").src = selectedLocation.image
  document.getElementById("fullscreen-stars").textContent = "⭐".repeat(Math.floor(selectedLocation.rating))
  document.getElementById("fullscreen-rating").textContent = selectedLocation.rating
  document.getElementById("fullscreen-description").textContent = selectedLocation.description
  document.getElementById("fullscreen-category").textContent =
    selectedLocation.category.charAt(0).toUpperCase() + selectedLocation.category.slice(1)
  document.getElementById("fullscreen-address").textContent = selectedLocation.address
  document.getElementById("fullscreen-hours").textContent = selectedLocation.hours
  document.getElementById("fullscreen-contact").textContent = selectedLocation.contact
}

function closeLocationFullscreen() {
  document.getElementById("location-fullscreen-modal").classList.remove("active")
}

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.remove("active")
  })
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Show selected tab
  document.getElementById(`${tabName}-tab`).classList.add("active")
  event.target.classList.add("active")
}

function openImageGallery() {
  showLocationFullscreen()
  // Switch to photos tab
  setTimeout(() => {
    showTab("photos")
  }, 100)
}

function showReviews() {
  showLocationFullscreen()
  // Switch to reviews tab
  setTimeout(() => {
    showTab("reviews")
  }, 100)
}

function selectDestination(destinationId) {
  const destination = locations.find(
    (loc) =>
      loc.id === Number.parseInt(destinationId.split("-")[1]) ||
      loc.name.toLowerCase().includes(destinationId.split("-")[0]),
  )
  if (destination) {
    selectedLocation = destination
    openPaymentModal()
  }
}

function openPaymentModal() {
  const modal = document.getElementById("payment-modal")
  modal.classList.add("active")
  currentStep = 1
  updatePaymentStep()

  // Pre-select destination if one is selected
  if (selectedLocation) {
    const destinationRadio = document.querySelector(
      `input[name="destination"][value*="${selectedLocation.name.toLowerCase().replace(/\s+/g, "-")}"]`,
    )
    if (destinationRadio) {
      destinationRadio.checked = true
      selectDestinationOption(destinationRadio.value)
    }
  }
}

function closePaymentModal() {
  document.getElementById("payment-modal").classList.remove("active")
  resetPaymentForm()
}

function resetPaymentForm() {
  currentStep = 1
  selectedDestination = null
  bookingData = {}

  // Reset form inputs
  document.querySelectorAll('input[type="radio"]').forEach((input) => (input.checked = false))
  document
    .querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"]')
    .forEach((input) => (input.value = ""))
  document.getElementById("visitor-count").value = 1

  // Reset UI
  updatePaymentStep()
  updateBookingSummary()
}

function updatePaymentStep() {
  // Update step indicators
  document.querySelectorAll(".step").forEach((step, index) => {
    if (index + 1 <= currentStep) {
      step.classList.add("active")
    } else {
      step.classList.remove("active")
    }
  })

  // Show current step content
  document.querySelectorAll(".payment-step").forEach((step, index) => {
    if (index + 1 === currentStep) {
      step.classList.add("active")
    } else {
      step.classList.remove("active")
    }
  })

  // Update navigation buttons
  const prevBtn = document.getElementById("prev-btn")
  const nextBtn = document.getElementById("next-btn")

  if (currentStep === 1) {
    prevBtn.style.display = "none"
    nextBtn.textContent = "Selanjutnya →"
  } else if (currentStep === 4) {
    prevBtn.style.display = "inline-block"
    nextBtn.style.display = "none"
  } else {
    prevBtn.style.display = "inline-block"
    nextBtn.style.display = "inline-block"
    nextBtn.textContent = currentStep === 3 ? "Bayar Sekarang" : "Selanjutnya →"
  }
}

function nextStep() {
  if (validateCurrentStep()) {
    if (currentStep === 3) {
      // Process payment
      processPayment()
    } else {
      currentStep++
      updatePaymentStep()
    }
  }
}

function previousStep() {
  if (currentStep > 1) {
    currentStep--
    updatePaymentStep()
  }
}

function validateCurrentStep() {
  switch (currentStep) {
    case 1:
      const selectedDest = document.querySelector('input[name="destination"]:checked')
      if (!selectedDest) {
        alert("Pilih destinasi terlebih dahulu!")
        return false
      }
      selectDestinationOption(selectedDest.value)
      return true

    case 2:
      const visitDate = document.getElementById("visit-date").value
      const bookerName = document.getElementById("booker-name").value
      const bookerEmail = document.getElementById("booker-email").value
      const bookerPhone = document.getElementById("booker-phone").value

      if (!visitDate || !bookerName || !bookerEmail || !bookerPhone) {
        alert("Harap lengkapi semua data pemesanan!")
        return false
      }

      // Validate date is not in the past
      const selectedDate = new Date(visitDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (selectedDate < today) {
        alert("Tanggal kunjungan tidak boleh di masa lalu!")
        return false
      }

      updateBookingData()
      return true

    case 3:
      const selectedPayment = document.querySelector('input[name="payment-method"]:checked')
      if (!selectedPayment) {
        alert("Pilih metode pembayaran!")
        return false
      }
      return true

    default:
      return true
  }
}

function selectDestinationOption(destinationValue) {
  const destination = locations.find(
    (loc) =>
      destinationValue.includes(loc.name.toLowerCase().replace(/\s+/g, "-")) ||
      destinationValue === loc.name.toLowerCase().replace(/\s+/g, "-"),
  )

  if (destination) {
    selectedDestination = destination

    // Update UI
    document.querySelectorAll(".destination-option").forEach((option) => {
      option.classList.remove("selected")
    })

    const selectedOption = document.querySelector(`[data-destination="${destinationValue}"]`)
    if (selectedOption) {
      selectedOption.classList.add("selected")
    }

    updateBookingSummary()
  }
}

function changeQuantity(delta) {
  const input = document.getElementById("visitor-count")
  const currentValue = Number.parseInt(input.value)
  const newValue = Math.max(1, Math.min(10, currentValue + delta))
  input.value = newValue
  updateBookingSummary()
}

function updateBookingSummary() {
  if (!selectedDestination) return

  const quantity = Number.parseInt(document.getElementById("visitor-count").value) || 1
  const visitDate = document.getElementById("visit-date").value

  // Parse price
  let price = 0
  if (selectedDestination.price && selectedDestination.price !== "Gratis") {
    price = Number.parseInt(selectedDestination.price.replace(/[^\d]/g, ""))
  }

  const total = price * quantity

  // Update summary display
  document.getElementById("summary-destination").textContent = selectedDestination.name
  document.getElementById("summary-date").textContent = visitDate || "-"
  document.getElementById("summary-quantity").textContent = `${quantity} orang`
  document.getElementById("summary-total").textContent = total === 0 ? "Gratis" : `Rp ${total.toLocaleString("id-ID")}`
}

function updateBookingData() {
  bookingData = {
    destination: selectedDestination,
    visitDate: document.getElementById("visit-date").value,
    quantity: Number.parseInt(document.getElementById("visitor-count").value),
    bookerName: document.getElementById("booker-name").value,
    bookerEmail: document.getElementById("booker-email").value,
    bookerPhone: document.getElementById("booker-phone").value,
    total: calculateTotal(),
  }
}

function calculateTotal() {
  if (!selectedDestination) return 0

  let price = 0
  if (selectedDestination.price && selectedDestination.price !== "Gratis") {
    price = Number.parseInt(selectedDestination.price.replace(/[^\d]/g, ""))
  }

  const quantity = Number.parseInt(document.getElementById("visitor-count").value) || 1
  return price * quantity
}

function processPayment() {
  const selectedPayment = document.querySelector('input[name="payment-method"]:checked')

  // Simulate payment processing
  setTimeout(() => {
    // Generate booking code
    const bookingCode = "BWG" + Date.now().toString().slice(-6)

    // Update confirmation details
    document.getElementById("booking-code").textContent = bookingCode
    document.getElementById("final-destination").textContent = bookingData.destination.name
    document.getElementById("final-date").textContent = new Date(bookingData.visitDate).toLocaleDateString("id-ID")
    document.getElementById("final-quantity").textContent = `${bookingData.quantity} orang`
    document.getElementById("final-total").textContent =
      bookingData.total === 0 ? "Gratis" : `Rp ${bookingData.total.toLocaleString("id-ID")}`

    // Add to payment history
    paymentHistory.unshift({
      id: bookingCode,
      destination: bookingData.destination.name,
      date: bookingData.visitDate,
      quantity: bookingData.quantity,
      total: bookingData.total,
      status: "completed",
      bookerName: bookingData.bookerName,
    })

    // Move to confirmation step
    currentStep = 4
    updatePaymentStep()

    console.log("[v0] Payment processed successfully:", bookingCode)
  }, 2000)
}

function downloadTicket(bookingCode) {
  if (bookingCode) {
    alert(`Mengunduh e-ticket untuk booking ${bookingCode}...`)
  } else {
    alert("Mengunduh e-ticket...")
  }
}

function showPaymentHistory() {
  closePaymentModal()
  const modal = document.getElementById("payment-history-modal")
  modal.classList.add("active")
  updateHistoryDisplay()
}

function closePaymentHistory() {
  document.getElementById("payment-history-modal").classList.remove("active")
}

function updateHistoryDisplay(filter = "all") {
  const historyList = document.querySelector(".history-list")
  let filteredHistory = paymentHistory

  if (filter !== "all") {
    filteredHistory = paymentHistory.filter((item) => item.status === filter)
  }

  historyList.innerHTML = ""

  filteredHistory.forEach((item) => {
    const historyItem = document.createElement("div")
    historyItem.className = `history-item ${item.status}`

    historyItem.innerHTML = `
      <div class="history-info">
        <h4>${item.destination}</h4>
        <p>Kode: ${item.id}</p>
        <p>Tanggal: ${new Date(item.date).toLocaleDateString("id-ID")}</p>
        <p>${item.quantity} orang</p>
      </div>
      <div class="history-status">
        <span class="status ${item.status}">
          ${item.status === "completed" ? "Selesai" : item.status === "pending" ? "Menunggu Pembayaran" : "Dibatalkan"}
        </span>
        <div class="history-total">Rp ${item.total.toLocaleString("id-ID")}</div>
      </div>
      <div class="history-actions">
        ${
          item.status === "completed"
            ? `<button class="btn-small" onclick="downloadTicket('${item.id}')">Download</button>
           <button class="btn-small" onclick="viewTicketDetails('${item.id}')">Detail</button>`
            : item.status === "pending"
              ? `<button class="btn-small primary" onclick="continuePayment('${item.id}')">Bayar</button>
           <button class="btn-small" onclick="cancelBooking('${item.id}')">Batal</button>`
              : `<button class="btn-small" onclick="viewTicketDetails('${item.id}')">Detail</button>`
        }
      </div>
    `

    historyList.appendChild(historyItem)
  })
}

function viewTicketDetails(bookingCode) {
  const booking = paymentHistory.find((item) => item.id === bookingCode)
  if (booking) {
    alert(
      `Detail booking ${bookingCode}:\n\nDestinasi: ${booking.destination}\nTanggal: ${new Date(booking.date).toLocaleDateString("id-ID")}\nJumlah: ${booking.quantity} orang\nTotal: Rp ${booking.total.toLocaleString("id-ID")}\nStatus: ${booking.status}`,
    )
  }
}

function continuePayment(bookingCode) {
  alert(`Melanjutkan pembayaran untuk booking ${bookingCode}...`)
  closePaymentHistory()
  openPaymentModal()
}

function cancelBooking(bookingCode) {
  if (confirm(`Apakah Anda yakin ingin membatalkan booking ${bookingCode}?`)) {
    const bookingIndex = paymentHistory.findIndex((item) => item.id === bookingCode)
    if (bookingIndex !== -1) {
      paymentHistory[bookingIndex].status = "cancelled"
      updateHistoryDisplay()
      alert("Booking berhasil dibatalkan.")
    }
  }
}

function rateExperience(bookingCode) {
  alert(`Memberikan rating untuk pengalaman di booking ${bookingCode}...`)
}

function initializeAuth() {
  console.log("[v0] Initializing authentication system...")

  // Check for saved user session
  const savedUser = localStorage.getItem("bandung_gis_user")
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser)
      isLoggedIn = true
      updateAuthUI()
      console.log("[v0] User session restored:", currentUser.name)
    } catch (error) {
      console.error("[v0] Error parsing saved user data:", error)
      localStorage.removeItem("bandung_gis_user")
    }
  }

  // Initialize password strength checker
  const registerPassword = document.getElementById("register-password")
  if (registerPassword) {
    registerPassword.addEventListener("input", checkPasswordStrength)
  }

  console.log("[v0] Authentication system initialized successfully!")
}

function updateAuthUI() {
  const authNavLink = document.getElementById("auth-nav-link")
  const userDropdown = document.getElementById("user-profile-dropdown")

  if (isLoggedIn && currentUser) {
    // Hide login link, show user dropdown
    authNavLink.style.display = "none"
    userDropdown.style.display = "block"

    // Update user info in dropdown
    document.getElementById("user-name-display").textContent = currentUser.name
    document.getElementById("user-email-display").textContent = currentUser.email
    document.getElementById("user-avatar-text").textContent = currentUser.name.charAt(0).toUpperCase()

    // Update settings form with user data
    updateSettingsForm()

    console.log("[v0] Auth UI updated for logged in user")
  } else {
    // Show login link, hide user dropdown
    authNavLink.style.display = "block"
    userDropdown.style.display = "none"

    console.log("[v0] Auth UI updated for guest user")
  }
}

function updateSettingsForm() {
  if (!currentUser) return

  document.getElementById("settings-name").value = currentUser.name || ""
  document.getElementById("settings-email").value = currentUser.email || ""
  document.getElementById("settings-phone").value = currentUser.phone || ""
  document.getElementById("settings-birthdate").value = currentUser.birthdate || ""
  document.getElementById("settings-address").value = currentUser.address || ""
  document.getElementById("settings-avatar-text").textContent = currentUser.name.charAt(0).toUpperCase()

  // Update preferences
  if (currentUser.preferences) {
    document.getElementById("email-notifications").checked = currentUser.preferences.emailNotifications !== false
    document.getElementById("booking-notifications").checked = currentUser.preferences.bookingNotifications !== false
    document.getElementById("promo-notifications").checked = currentUser.preferences.promoNotifications || false
    document.getElementById("favorite-theme").value = currentUser.preferences.favoriteTheme || "default"
    document.getElementById("language").value = currentUser.preferences.language || "id"
  }
}

function openAuthModal(type = "login") {
  const modal = document.getElementById("auth-modal")
  modal.classList.add("active")
  switchAuthTab(type)
}

function closeAuthModal() {
  document.getElementById("auth-modal").classList.remove("active")
  clearAuthForms()
}

function switchAuthTab(tab) {
  authModalType = tab

  // Update tab buttons
  document.querySelectorAll(".auth-tab").forEach((tabBtn) => {
    tabBtn.classList.remove("active")
  })
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active")

  // Update forms
  document.querySelectorAll(".auth-form").forEach((form) => {
    form.classList.remove("active")
  })

  // Update title and show appropriate form
  const title = document.getElementById("auth-title")
  switch (tab) {
    case "login":
      title.textContent = "Masuk ke Akun Anda"
      document.getElementById("login-form").classList.add("active")
      break
    case "register":
      title.textContent = "Buat Akun Baru"
      document.getElementById("register-form").classList.add("active")
      break
    case "forgot":
      title.textContent = "Reset Password"
      document.getElementById("forgot-password-form").classList.add("active")
      break
  }
}

function clearAuthForms() {
  document.querySelectorAll(".auth-form input").forEach((input) => {
    input.value = ""
  })
  document.querySelectorAll('.auth-form input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = false
  })
  clearAuthMessages()
}

function showAuthMessage(message, type = "error") {
  // Remove existing messages
  clearAuthMessages()

  const messageDiv = document.createElement("div")
  messageDiv.className = `auth-message ${type}`
  messageDiv.innerHTML = `
    <span>${type === "success" ? "✅" : "❌"}</span>
    ${message}
  `

  const activeForm = document.querySelector(".auth-form.active")
  activeForm.insertBefore(messageDiv, activeForm.firstChild)

  // Auto remove after 5 seconds
  setTimeout(() => {
    messageDiv.remove()
  }, 5000)
}

function clearAuthMessages() {
  document.querySelectorAll(".auth-message").forEach((msg) => msg.remove())
}

function handleLogin(event) {
  event.preventDefault()

  const email = document.getElementById("login-email").value
  const password = document.getElementById("login-password").value
  const rememberMe = document.getElementById("remember-me").checked

  if (!email || !password) {
    showAuthMessage("Harap lengkapi email dan password!")
    return
  }

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.disabled = true

  // Simulate login API call
  setTimeout(() => {
    // Mock authentication - in real app, this would be an API call
    const mockUser = {
      id: 1,
      name: "Ahmad Rizki",
      email: email,
      phone: "+62 812-3456-7890",
      joinDate: new Date().toISOString(),
      preferences: {
        emailNotifications: true,
        bookingNotifications: true,
        promoNotifications: false,
        favoriteTheme: "default",
        language: "id",
      },
    }

    // Simulate successful login
    currentUser = mockUser
    isLoggedIn = true

    // Save to localStorage if remember me is checked
    if (rememberMe) {
      localStorage.setItem("bandung_gis_user", JSON.stringify(currentUser))
    }

    // Update UI
    updateAuthUI()
    closeAuthModal()

    showAuthMessage("Login berhasil! Selamat datang kembali.", "success")

    // Remove loading state
    submitBtn.classList.remove("loading")
    submitBtn.disabled = false

    console.log("[v0] User logged in successfully:", currentUser.name)
  }, 2000)
}

function handleRegister(event) {
  event.preventDefault()

  const name = document.getElementById("register-name").value
  const email = document.getElementById("register-email").value
  const phone = document.getElementById("register-phone").value
  const password = document.getElementById("register-password").value
  const confirmPassword = document.getElementById("register-confirm-password").value
  const agreeTerms = document.getElementById("agree-terms").checked

  // Validation
  if (!name || !email || !phone || !password || !confirmPassword) {
    showAuthMessage("Harap lengkapi semua field!")
    return
  }

  if (password !== confirmPassword) {
    showAuthMessage("Password dan konfirmasi password tidak cocok!")
    return
  }

  if (password.length < 8) {
    showAuthMessage("Password minimal 8 karakter!")
    return
  }

  if (!agreeTerms) {
    showAuthMessage("Harap setujui syarat dan ketentuan!")
    return
  }

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.disabled = true

  // Simulate registration API call
  setTimeout(() => {
    const newUser = {
      id: Date.now(),
      name: name,
      email: email,
      phone: phone,
      joinDate: new Date().toISOString(),
      preferences: {
        emailNotifications: true,
        bookingNotifications: true,
        promoNotifications: false,
        favoriteTheme: "default",
        language: "id",
      },
    }

    currentUser = newUser
    isLoggedIn = true

    // Save to localStorage
    localStorage.setItem("bandung_gis_user", JSON.stringify(currentUser))

    // Update UI
    updateAuthUI()
    closeAuthModal()

    showAuthMessage("Registrasi berhasil! Selamat datang di Bandung GIS.", "success")

    // Remove loading state
    submitBtn.classList.remove("loading")
    submitBtn.disabled = false

    console.log("[v0] User registered successfully:", currentUser.name)
  }, 2000)
}

function handleForgotPassword(event) {
  event.preventDefault()

  const email = document.getElementById("forgot-email").value

  if (!email) {
    showAuthMessage("Harap masukkan email Anda!")
    return
  }

  // Show loading state
  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.disabled = true

  // Simulate forgot password API call
  setTimeout(() => {
    showAuthMessage("Link reset password telah dikirim ke email Anda!", "success")

    // Remove loading state
    submitBtn.classList.remove("loading")
    submitBtn.disabled = false

    // Switch back to login after 3 seconds
    setTimeout(() => {
      switchAuthTab("login")
    }, 3000)

    console.log("[v0] Password reset email sent to:", email)
  }, 2000)
}

function checkPasswordStrength() {
  const password = document.getElementById("register-password").value
  const strengthBar = document.querySelector(".strength-fill")
  const strengthText = document.querySelector(".strength-text")

  let strength = 0
  let strengthLabel = "Lemah"

  // Check password criteria
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^A-Za-z0-9]/.test(password)) strength++

  // Update strength indicator
  strengthBar.className = "strength-fill"

  if (strength <= 1) {
    strengthBar.classList.add("weak")
    strengthLabel = "Lemah"
  } else if (strength <= 2) {
    strengthBar.classList.add("fair")
    strengthLabel = "Cukup"
  } else if (strength <= 3) {
    strengthBar.classList.add("good")
    strengthLabel = "Baik"
  } else {
    strengthBar.classList.add("strong")
    strengthLabel = "Kuat"
  }

  strengthText.textContent = strengthLabel
}

function togglePassword(inputId) {
  const input = document.getElementById(inputId)
  const button = input.nextElementSibling

  if (input.type === "password") {
    input.type = "text"
    button.textContent = "🙈"
  } else {
    input.type = "password"
    button.textContent = "👁️"
  }
}

function toggleProfileDropdown() {
  const dropdown = document.getElementById("profile-dropdown-menu")
  dropdown.classList.toggle("active")
}

function logout() {
  if (confirm("Apakah Anda yakin ingin keluar?")) {
    currentUser = null
    isLoggedIn = false
    localStorage.removeItem("bandung_gis_user")
    updateAuthUI()

    // Close dropdown
    document.getElementById("profile-dropdown-menu").classList.remove("active")

    console.log("[v0] User logged out successfully")
    alert("Anda telah berhasil keluar. Terima kasih!")
  }
}

function showUserProfile() {
  // Close dropdown
  document.getElementById("profile-dropdown-menu").classList.remove("active")

  // Scroll to profile section
  document.getElementById("profile").scrollIntoView({ behavior: "smooth" })
}

function showSettings() {
  // Close dropdown
  document.getElementById("profile-dropdown-menu").classList.remove("active")

  // Open settings modal
  const modal = document.getElementById("settings-modal")
  modal.classList.add("active")
  switchSettingsTab("profile")
}

function closeSettingsModal() {
  document.getElementById("settings-modal").classList.remove("active")
}

function switchSettingsTab(tab) {
  // Update tab buttons
  document.querySelectorAll(".settings-tab").forEach((tabBtn) => {
    tabBtn.classList.remove("active")
  })
  document.querySelector(`[data-tab="${tab}"]`).classList.add("active")

  // Update forms
  document.querySelectorAll(".settings-form").forEach((form) => {
    form.classList.remove("active")
  })
  document.getElementById(`${tab}-settings`).classList.add("active")
}

function updateProfile(event) {
  event.preventDefault()

  if (!currentUser) return

  const name = document.getElementById("settings-name").value
  const email = document.getElementById("settings-email").value
  const phone = document.getElementById("settings-phone").value
  const birthdate = document.getElementById("settings-birthdate").value
  const address = document.getElementById("settings-address").value

  // Update user data
  currentUser.name = name
  currentUser.email = email
  currentUser.phone = phone
  currentUser.birthdate = birthdate
  currentUser.address = address

  // Save to localStorage
  localStorage.setItem("bandung_gis_user", JSON.stringify(currentUser))

  // Update UI
  updateAuthUI()

  alert("Profil berhasil diperbarui!")
  console.log("[v0] Profile updated successfully")
}

function changePassword(event) {
  event.preventDefault()

  const currentPassword = document.getElementById("current-password").value
  const newPassword = document.getElementById("new-password").value
  const confirmNewPassword = document.getElementById("confirm-new-password").value

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    alert("Harap lengkapi semua field password!")
    return
  }

  if (newPassword !== confirmNewPassword) {
    alert("Password baru dan konfirmasi tidak cocok!")
    return
  }

  if (newPassword.length < 8) {
    alert("Password baru minimal 8 karakter!")
    return
  }

  // Simulate password change
  setTimeout(() => {
    alert("Password berhasil diubah!")
    event.target.reset()
    console.log("[v0] Password changed successfully")
  }, 1000)
}

function updatePreferences(event) {
  event.preventDefault()

  if (!currentUser) return

  const preferences = {
    emailNotifications: document.getElementById("email-notifications").checked,
    bookingNotifications: document.getElementById("booking-notifications").checked,
    promoNotifications: document.getElementById("promo-notifications").checked,
    favoriteTheme: document.getElementById("favorite-theme").value,
    language: document.getElementById("language").value,
  }

  currentUser.preferences = preferences

  // Save to localStorage
  localStorage.setItem("bandung_gis_user", JSON.stringify(currentUser))

  // Apply favorite theme if changed
  if (preferences.favoriteTheme !== "default") {
    setTheme(preferences.favoriteTheme)
  }

  alert("Preferensi berhasil disimpan!")
  console.log("[v0] Preferences updated successfully")
}

function changeAvatar() {
  alert("Fitur ubah foto profil akan segera hadir!")
}

function removeAvatar() {
  if (confirm("Hapus foto profil?")) {
    alert("Foto profil berhasil dihapus!")
  }
}

function setup2FA() {
  alert("Fitur autentikasi dua faktor akan segera hadir!")
}

function manageSessions() {
  alert("Fitur kelola sesi akan segera hadir!")
}

function showTerms() {
  alert(
    "Syarat & Ketentuan:\n\n1. Pengguna bertanggung jawab atas keamanan akun\n2. Dilarang menyalahgunakan platform\n3. Data pribadi akan dijaga kerahasiaannya\n4. Pembayaran mengikuti ketentuan yang berlaku",
  )
}

function showForgotPassword() {
  switchAuthTab("forgot")
}

// Social login functions
function loginWithGoogle() {
  alert("Login dengan Google akan segera hadir!")
}

function loginWithFacebook() {
  alert("Login dengan Facebook akan segera hadir!")
}

function registerWithGoogle() {
  alert("Daftar dengan Google akan segera hadir!")
}

function registerWithFacebook() {
  alert("Daftar dengan Facebook akan segera hadir!")
}

// --- FUNGSI BARU UNTUK INTEGRASI ROUTING ---

// 1. Fungsi Inisialisasi Routing
function initializeRouting(mapInstance) {
    // Inisialisasi Leaflet Routing Control
    routingControl = L.Routing.control({
        router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
        }),
        waypoints: [], // Biarkan kosong, akan diisi saat tombol diklik
        // Arahkan output instruksi rute ke div custom di panel
        container: document.getElementById('route-instructions'), 
        routeWhileDragging: true,
        geocoder: L.Control.Geocoder.nominatim(),
        showAlternatives: false,
        fitSelectedRoute: true, 
        createMarker: function (i, wp, n) {
            return L.marker(wp.latLng, {
                draggable: true,
            }).bindPopup(i === 0 ? "Titik Asal" : "Titik Tujuan");
        },
    }).addTo(mapInstance);

    // Sembunyikan kontrol routing dari tampilan peta agar hanya tampil di panel
    routingControl.getContainer().style.display = 'none';

    // Event listener untuk tombol "Cari Rute"
    document
        .getElementById("routeBtn")
        .addEventListener("click", calculateRoute);

    // Event listener klik peta untuk mengisi input start/end
    mapInstance.on("click", function (e) {
        const latlngStr = `${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`;
        
        // Gunakan clickCount untuk bergantian mengisi input start dan end
        if (clickCount % 2 === 0) {
            document.getElementById("origin-input").value = latlngStr;
        } else {
            document.getElementById("destination-input").value = latlngStr;
        }
        clickCount++;
    });
}

// 2. Fungsi Parsing Koordinat
function parseLatLng(str) {
    // Memeriksa apakah input adalah format koordinat "lat,lng"
    const parts = str.split(",").map((x) => x.trim());
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return L.latLng(parseFloat(parts[0]), parseFloat(parts[1]));
    }
    // Jika bukan, kembalikan string (alamat/nama tempat) agar ditangani Geocoder
    return str; 
}

// 3. Fungsi Menghitung Rute
function calculateRoute() {
    if (!routingControl) return;

    const s = document.getElementById("origin-input").value.trim();
    const e = document.getElementById("destination-input").value.trim();

    const wp1 = parseLatLng(s);
    const wp2 = parseLatLng(e);

    // Filter waypoint yang valid
    const waypoints = [wp1, wp2].filter(wp => wp && (typeof wp === 'string' ? wp.length > 0 : true));

    if (waypoints.length < 2) {
        alert('Mohon masukkan Titik Asal dan Titik Tujuan yang valid (koordinat "lat,lng" atau nama tempat).');
        return;
    }

    // Tampilkan kontrol routing di peta saat rute dicari
    routingControl.getContainer().style.display = 'block';

    // Set Waypoints dan panggil perhitungan rute
    routingControl.setWaypoints(waypoints);
    
    // Tutup panel info lokasi jika sedang terbuka
    closeLocationPanel(); 
}

// 4. Fungsi Hapus Rute
function clearRoute() {
    if (routingControl) {
        // Hapus rute dari peta
        routingControl.setWaypoints([]);
        // Kosongkan input
        document.getElementById("origin-input").value = "";
        document.getElementById("destination-input").value = "";
        // Sembunyikan kembali kontrol routing dari peta
        routingControl.getContainer().style.display = 'none';
        // Clear isi div instruksi
        document.getElementById("route-instructions").innerHTML = "";
    }
}

// 5. Tambahkan fungsi show/close panel (Jika belum ada di 2script.js.txt)
// HTML Anda memanggil fungsi ini, jadi kita harus memastikannya ada.
function showRoutePanel() {
    document.getElementById("routing-panel").classList.add("active");
}

function closeRoutingPanel() {
    document.getElementById("routing-panel").classList.remove("active");
}