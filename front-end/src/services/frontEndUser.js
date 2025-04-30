// if user authenticated, redirects to plantMap.html
// if not, shows login and registration forms
async function checkAuthentication() {
    try {
        const response = await fetch('http://localhost:4002/authenticated', {
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
        const response = await fetch('http://localhost:4002/login', {
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
        const response = await fetch('http://localhost:4002/register', {
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

// these functions are to switch between pages
function redirectRegistration(event){
    window.location.href = "userRegister.html";
}

function redirectLogin(event){
    window.location.href = "userLogin.html";
}

// function to handle user logout
async function logoutUser(event){

    event. preventDefault(); // prevent default form submission

    let logoutConfirmed =  document.getElementById("logout-checkbox").checked;

    // check if the user confirmed logout
    if(logoutConfirmed){
        try{
            // call the api to log the user out
            const response = await fetch('http://localhost:4002/logout',{
                method: 'POST',
                credentials: 'include',
            });

            const result = await response.text();
            alert(result);

            // redirect to the login page after logout
            window.location.href = "userLogin.html";
        }catch(error){
            console.error("Error logging out:", error);
            alert("Error logging out");
        }
    } 
    else{
        alert("Please confirm logout by checking the box.");
    }
}


// the following functions are for the logout page
window.onload = async function(){
    try{
        const currentPage = window.location.pathname.split("/").pop();

        // for login page, check if the user is already authenticated
        if(currentPage === "userLogin.html"){
            await checkAuthentication();
        }

        // for other pages, check if the user is authenticated and redirect to the login page
        else if (currentPage !== "userRegister.html"){
            const response = await fetch('http://localhost:4002/authenticated',{
                credentials: 'include'
            });

            const result = await response.text();

            if(result !== "Authenticated"){
                window.location.href = "userLogin.html"; // redirect to the login page if not authenticated
            }
        }
    }
    catch(error){
        console.error("Authentication check failed:",error);
        window.location.href = "userLogin.html"; // redirect to the login page if an error occurs
    }
}


// the following funcitons are for the profile page


// the following funcitons are for the edit profile page


// the following functions are for the my plants page
