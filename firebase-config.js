// --------------------------------------------------------------
// FIREBASE CONFIGURATION & INITIALIZATION
// --------------------------------------------------------------

// TODO: REPLACE THIS WITH YOUR FIREBASE CONFIGURATION
// You can get this from the Firebase Console -> Project Settings
// Use var to avoid "Identifier has already been declared" errors if script is loaded twice
var firebaseConfig = {
    apiKey: "AIzaSyBIAW44Ggpve5V3iUidjSQKOr6WegQ-WB8",
    authDomain: "student-city-nav.firebaseapp.com",
    projectId: "student-city-nav",
    storageBucket: "student-city-nav.firebasestorage.app",
    messagingSenderId: "735026767334",
    appId: "1:735026767334:web:236c9559ca9385f8052227",
    measurementId: "G-RX7LN7E3Z6",
    databaseURL: "https://student-city-nav-default-rtdb.firebaseio.com"
};

// Initialize Firebase
// Check if firebase is already initialized to avoid errors
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase Initialized");
} else {
    firebase.app(); // if already initialized, use that one
}
