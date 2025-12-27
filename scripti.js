// --------------------------------------------------------------
// GLOBAL VARIABLES
// --------------------------------------------------------------
let map;
let markers = [];
let allLocations = [];
let currentCategory = 'all';
let infoWindow; // Global InfoWindow
let auth;
let db;

try {
    auth = firebase.auth();
    db = firebase.firestore();
} catch (e) {
    console.error("Firebase initialization failed in scripti.js:", e);
}

// Dark Mode Style for Google Maps
const mapStyles = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#38414e" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#212a37" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9ca5b3" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#746855" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1f2835" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#f3d19c" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#17263c" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

// --------------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------------
// --------------------------------------------------------------
// INITIALIZATION
// --------------------------------------------------------------
// Note: initMap is called by the Google Maps API callback in index.html
function initMap() {
    console.log("Initializing map...");
    try {
        // Initialize map centered on a default location (London)
        map = new google.maps.Map(document.getElementById("map"), {
            center: { lat: 51.505, lng: -0.09 },
            zoom: 13,
            styles: mapStyles,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });

        infoWindow = new google.maps.InfoWindow();

        // Map loaded successfully, proceed to auth
        setupAuthListener();
    } catch (error) {
        console.error("Error initializing map:", error);
        handleMapError("Map initialization failed. Please check your API key.");
    }
}

// Global handler for Google Maps Auth Failure
window.gm_authFailure = function () {
    console.error("Google Maps Authentication Failure");
    handleMapError("Google Maps API Key Invalid or Restricted.");
};

function handleMapError(message) {
    const mapDiv = document.getElementById("map");
    mapDiv.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; background: #0f172a;">
            <i class="fa-solid fa-triangle-exclamation fa-3x text-warning mb-3"></i>
            <h4>Map Failed to Load</h4>
            <p class="text-muted">${message}</p>
            <small>Check console for details.</small>
        </div>
    `;

    // Still try to load list data even if map fails
    setupAuthListener();
}

// Fallback timeout if initMap is never called (e.g. script load error)
setTimeout(() => {
    if (!map) {
        console.warn("Map initialization timed out.");
        // Only show error if the map div is still empty (meaning initMap didn't run)
        const mapDiv = document.getElementById("map");
        if (mapDiv && !mapDiv.hasChildNodes()) {
            handleMapError("Map script failed to load. Check internet connection or API Key.");
        }
    }
}, 5000);

function setupAuthListener() {
    // Check for guest mode
    const isGuest = localStorage.getItem('guestMode') === 'true';
    if (isGuest) {
        console.log("Guest mode active");
        // Update UI to show guest state
        const logoutBtn = document.querySelector('button[onclick="logout()"]');
        if (logoutBtn) logoutBtn.title = "Exit Guest Mode";

        loadLocations();
        return;
    }

    auth.onAuthStateChanged(user => {
        if (!user) {
            // User is not signed in, redirect to login
            window.location.href = 'login.html';
        } else {
            // User is signed in, load data
            console.log("User authenticated:", user.email);
            loadLocations();
        }
    });
}

function logout() {
    localStorage.removeItem('guestMode');
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error("Sign out error", error);
        window.location.href = 'login.html';
    });
}

// --------------------------------------------------------------
// DATA HANDLING
// --------------------------------------------------------------
function loadLocations() {
    const listContainer = document.getElementById('locations-list');
    listContainer.innerHTML = `
        <div class="text-center text-muted mt-5">
            <div class="spinner-border text-accent" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading map data...</p>
        </div>
    `;

    db.collection('locations').onSnapshot((snapshot) => {
        allLocations = [];
        snapshot.forEach((doc) => {
            allLocations.push({ id: doc.id, ...doc.data() });
        });

        if (allLocations.length === 0) {
            console.log("No data found in Firestore, loading demo data...");
            loadDemoData();
        } else {
            renderApp();
        }
    }, (error) => {
        console.error("Error loading locations:", error);
        console.log("Falling back to demo data due to error...");
        loadDemoData();
    });
}

function loadDemoData() {
    // Sample data to ensure the app looks "perfect" and populated immediately
    allLocations = [
        {
            id: 'demo1',
            name: 'Student Hub Central',
            category: 'social',
            description: 'A popular meeting spot for students with free Wi-Fi and coffee.',
            lat: 51.505,
            lng: -0.09
        },
        {
            id: 'demo2',
            name: 'Budget Bites',
            category: 'food',
            description: 'Amazing street food at student-friendly prices.',
            lat: 51.51,
            lng: -0.1
        },
        {
            id: 'demo3',
            name: 'Green Park Dorms',
            category: 'accommodation',
            description: 'Affordable student housing near the university campus.',
            lat: 51.50,
            lng: -0.08
        },
        {
            id: 'demo4',
            name: 'The Old Library',
            category: 'social',
            description: 'Historic library open 24/7 for study sessions.',
            lat: 51.515,
            lng: -0.095
        },
        {
            id: 'demo5',
            name: 'Noodle Bar',
            category: 'food',
            description: 'Best ramen in town, 10% discount for students.',
            lat: 51.508,
            lng: -0.11
        }
    ];
    renderApp();

    // Notify user
    const listContainer = document.getElementById('locations-list');
    const alert = document.createElement('div');
    alert.className = 'alert alert-info m-3 small';
    alert.innerHTML = '<i class="fa-solid fa-info-circle me-2"></i>Showing demo data (Database empty or inaccessible)';
    listContainer.prepend(alert);
}

function renderApp() {
    clearMarkers();
    const listContainer = document.getElementById('locations-list');
    listContainer.innerHTML = '';

    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filteredLocations = allLocations.filter(loc => {
        const matchesCategory = currentCategory === 'all' || loc.category === currentCategory;
        const matchesSearch = loc.name.toLowerCase().includes(searchTerm) ||
            (loc.description && loc.description.toLowerCase().includes(searchTerm));
        return matchesCategory && matchesSearch;
    });

    if (filteredLocations.length === 0) {
        listContainer.innerHTML = '<div class="text-center text-muted mt-4">No locations found.</div>';
        return;
    }

    const bounds = new google.maps.LatLngBounds();

    filteredLocations.forEach(loc => {
        // Create Marker
        const marker = createMarker(loc);
        bounds.extend(marker.getPosition());

        // Create List Item
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1 text-white">${loc.name}</h6>
                    <p class="mb-1 small text-muted text-truncate" style="max-width: 200px;">${loc.description || 'No description'}</p>
                </div>
                ${getCategoryBadge(loc.category)}
            </div>
        `;
        item.addEventListener('click', () => {
            focusOnLocation(loc);
        });
        listContainer.appendChild(item);
    });

    // Fit map to bounds if we have markers
    if (markers.length > 0) {
        map.fitBounds(bounds);
        // Optional: Zoom out slightly if too zoomed in (e.g. single point)
        const listener = google.maps.event.addListener(map, "idle", () => {
            if (map.getZoom() > 16) map.setZoom(16);
            google.maps.event.removeListener(listener);
        });
    }
}

function createMarker(loc) {
    const markerColor = getCategoryColor(loc.category);

    const marker = new google.maps.Marker({
        position: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) },
        map: map,
        title: loc.name,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: markerColor,
            fillOpacity: 1,
            strokeColor: "white",
            strokeWeight: 2,
        },
    });

    const popupContent = `
        <div style="color: #333; padding: 5px; min-width: 200px;">
            <h6 style="margin-bottom: 5px; font-weight: bold;">${loc.name}</h6>
            <div class="mb-2">${getCategoryBadge(loc.category)}</div>
            <p style="margin: 0; font-size: 0.9em; color: #555;">${loc.description || ''}</p>
        </div>
    `;

    marker.addListener("click", () => {
        infoWindow.setContent(popupContent);
        infoWindow.open(map, marker);
    });

    marker.metadata = { id: loc.id };
    markers.push(marker);

    return marker;
}

function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

function focusOnLocation(loc) {
    const latLng = { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };
    map.panTo(latLng);
    map.setZoom(16);

    const marker = markers.find(m => m.metadata.id === loc.id);
    if (marker) {
        // Trigger click to open info window
        google.maps.event.trigger(marker, 'click');
    }
}

function addLocation(locationData) {
    return db.collection('locations').add(locationData);
}

// --------------------------------------------------------------
// HELPERS
// --------------------------------------------------------------
function getCategoryBadge(category) {
    let colorClass = 'bg-secondary';
    let icon = 'fa-map-marker-alt';

    if (category === 'accommodation') { colorClass = 'bg-primary'; icon = 'fa-home'; }
    if (category === 'food') { colorClass = 'bg-success'; icon = 'fa-utensils'; }
    if (category === 'social') { colorClass = 'bg-warning text-dark'; icon = 'fa-users'; }

    const label = category.charAt(0).toUpperCase() + category.slice(1);
    return `<span class="badge ${colorClass} rounded-pill"><i class="fa-solid ${icon} me-1"></i>${label}</span>`;
}

function getCategoryColor(category) {
    if (category === 'accommodation') return '#0ea5e9'; // Sky Blue
    if (category === 'food') return '#22c55e'; // Green
    if (category === 'social') return '#eab308'; // Yellow
    return '#94a3b8'; // Slate
}

// --------------------------------------------------------------
// EVENT LISTENERS
// --------------------------------------------------------------

// Navbar Category Filtering
document.querySelectorAll('.nav-link[data-category]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        currentCategory = e.target.getAttribute('data-category');
        renderApp();
    });
});

// Search Filtering
document.getElementById('searchInput').addEventListener('input', () => {
    renderApp();
});

// Add Location Form Submission
document.getElementById('addLocationForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('locName').value;
    const category = document.getElementById('locCategory').value;
    const desc = document.getElementById('locDesc').value;
    const lat = document.getElementById('locLat').value;
    const lng = document.getElementById('locLng').value;

    const newLocation = {
        name: name,
        category: category,
        description: desc,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Adding...';

    addLocation(newLocation)
        .then(() => {
            const modalEl = document.getElementById('addLocationModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            e.target.reset();
            alert("Location added successfully!");
        })
        .catch((error) => {
            console.error("Error adding location: ", error);
            alert("Failed to add location. Check console for details.");
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
});
