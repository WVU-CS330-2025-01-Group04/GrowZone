const API_URL = 'https://cs330-2025-01-group04-backend-gfesgxgxddedhyb4.eastus2-01.azurewebsites.net';
// if user authenticated, redirects to plantMap.html
// if not, shows login and registration forms
async function checkAuthentication() {
    try {
        const response = await fetch(`${API_URL}/login`, {
            credentials: 'include'
        });
        const text = await response.text();
        if (text === "Authenticated") {
            window.location.href = "plantMap.html"; // redirect on successful authentication
        }
    } catch (error) {
        console.error("Error checking authentication:", error);
    }
}

// handle user login: tries user credentials to log in and redirects to plantMap.html if successful
// if not, shows error message
async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        alert("Please fill out both fields.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            window.location.href = "plantMap.html"; // redirect when successful
        } else {
            alert(data.message);  // otherwise shows error message
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("An error occurred during login.");
    }
}

// handles user registration: checks if the username is already taken and if the passwords match
// if not, shows error message
async function handleRegistration(event) {
    event.preventDefault();

    const newUsername = document.getElementById("newUsername").value.trim();
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!newUsername || !newPassword || !confirmPassword) {
        alert("Please fill out all fields.");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: newUsername, password: newPassword }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            window.location.href = "plantMap.html"; // redirect when successful
        } else {
            alert(data.message || "Registration failed."); // shows error message if registration fails
        }
    } catch (error) {
        console.error("Registration error:", error);
        alert("An error occurred during registration.");
    }
}

async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/profile`, {
            method: 'GET',
            credentials: 'include'
        })
        const data = await response.json();

        if (response.ok) {
            document.getElementById('displayUsername').textContent = data.username || 'N/A';
            document.getElementById('displayPlants').textContent = data.plantCount || 0;
            document.getElementById('plant-badge').textContent = data.plantCount || 0;

            if (data.username && data.username.length > 0) {
                document.getElementById('userAvatar').textContent = data.username.charAt(0).toUpperCase();
            }
        } else {
            alert(data.message || 'Unable to load profile.');
            window.location.href = 'index.html'; // kick back to login
        }
    } catch (err) {
        console.error('Error loading profile:', err);
        alert('Error loading profile.');
        window.location.href = 'index.html'; // redirect on serious error
    }
}

async function loadEditProfile(event) {
    try {
        // check if the user is authenticated
        const authResponse = await fetch(`${API_URL}/authenticated`, {
            credentials: 'include'
        });

        const authResult = await authResponse.text();

        const profileResponse = await fetch(`${API_URL}/profile`, {
            credentials: 'include'
        });

        if (!profileResponse.ok) {
            throw new Error(`Failed to fetch profile data: ${profileResponse.status}`);
        }

        const userData = await profileResponse.json();

        // display the user data
        document.getElementById("usernameInput").value = userData.username;

        // set avatar to the first letter of the username
        if (userData.username && userData.username.length > 0) {
            document.getElementById("userAvatar").textContent = userData.username.charAt(0).toUpperCase();
        }

    } catch (error) {
        console.error("Error loading user profile:", error);
        document.getElementById("usernameInput").value = "Error loading profile";
        alert("Error loading the profile.");
    }
}

async function saveUsername(event) {
    let newUsername;

    try {
        newUsername = document.getElementById("usernameInput").value.trim();

        if (!newUsername) {
            alert("Please enter a username");
            return;
        }
    } catch (error) {
        console.error("Error getting username input:", error.message);
        console.error("Stack trace:", error.stack);
        alert("Failed to read username input.");
        return;
    }

    let response;
    try {
        response = await fetch(`${API_URL}/update-profile`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ username: newUsername }),
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error("Error during fetch:", error.message);
        console.error("Stack trace:", error.stack);
        alert("Could not reach the server.");
        return;
    }
    
    let result;
    try {
        result = await response.json();
    } catch (error) {
        console.error("Error parsing JSON:", error.message);
        console.error("Stack trace:", error.stack);
        alert("Server gave a bad response.");
        return;
    }

    try {
        if (response.ok) {
            alert(result.message + " Profile updated successfully!");
            window.location.href = "profilepage.html";
        } else {
            alert(result.message + " Failed to update profile.");
        }
    } catch (error) {
        console.error("Error handling response:", error.message);
        console.error("Stack trace:", error.stack);
        alert("Something went wrong after getting a response.");
    }
}

function redirectLogin(event) {
    event.preventDefault(); // Prevent default link behavior
    window.location.href = "index.html"; // Redirect to login page
}

function redirectRegistration(event) {
    event.preventDefault(); // Prevent default link behavior
    window.location.href = "userRegister.html"; // Redirect to registration page
}

window.addEventListener('DOMContentLoaded', () => {
    // If we're on the edit profile page
    if (document.getElementById("usernameInput")) {
        loadEditProfile();

        const saveButton = document.getElementById("saveButton");
        if (saveButton) {
            saveButton.addEventListener("click", saveUsername);
        }
    }

    // If we have the displayUsername element (profile page)
    if (document.getElementById("displayUsername")) {
        loadProfile();
    }

    // Handles the user logout process when the logout button is clicked
async function logoutUser(event) {
    // Prevent the default form submission
    event.preventDefault();
    
    // Check if the confirmation checkbox is checked
    const logoutCheckbox = document.getElementById("logout-checkbox");
    
    if (!logoutCheckbox.checked) {
        alert("Please confirm that you want to log out by checking the box.");
        return false;
    }
    
    try {
        // Make the server request to log out
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include' // Include credentials to send cookies
        });
        
        // Handle response
        if (response.ok) {
            const data = await response.json();
            alert(data.message || "You have been successfully logged out.");
            window.location.href = "index.html"; // Redirect to login page
        } else {
            const data = await response.json();
            alert(data.message || "Logout failed. Please try again."); 
        }
    } catch (error) {
        console.error("Logout error:", error);
        alert("An error occurred during logout.");
    }
    
    return false; // Prevent default form submission
}

// When the page loads, check if the user is authenticated
window.addEventListener('DOMContentLoaded', () => {
    // Check if the user is authenticated
    fetch(`${API_URL}/authenticated`, {
        credentials: 'include'
    })
    .then(response => response.text())
    .then(text => {
        if (text !== "Authenticated") {
            window.location.href = "index.html"; // Redirect to login if not authenticated
        }
    })
    .catch(error => {
        console.error("Error checking authentication:", error);
        window.location.href = "index.html"; // Redirect on error
    });
    
    // Initialize logout button state
    const logoutCheckbox = document.getElementById('logout-checkbox');
    const logoutButton = document.querySelector('.logout-button');
    
    if (logoutCheckbox && logoutButton) {
        // Set initial button state
        logoutButton.disabled = !logoutCheckbox.checked;
        
        // Add event listener for checkbox change
        logoutCheckbox.addEventListener('change', () => {
            logoutButton.disabled = !logoutCheckbox.checked;
        });
    }
});
});
