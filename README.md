# GrowZone

## Plant information and community platform.

 - GrowZone is a web application that allows users to search for plant information, save their favorite plants, and share plant-related content with the community. The application focuses on providing accurate plant data through integration with USDA plant database.

## Features:
- **`User Authentication:`** Secure login, logout, and registration functionality.
- **`Plant Search:`** Search for plants by common name, filtered by state.
- **`Plant Information:`** Detailed information about plants, including the scientific name, family name,
- **`Save Plants:`** Save your favorite plants to your profile for easy access.
- **`User Profiles:`** View and edit your profile information.
- **`Community Posts:`** Create and view plant related posts.

## Technologies Used:
- **`Frontend`**: HTML, CSS, Javascript
- **`Backend`**: Node.js, Express.js
- **`Database`**: MySQL
- **`Authentication`**: Expresss-session
- **`Web Scraping`**: Puppeteer (for retrieving data from USDA plant database)
- **`File Uploads`**: Multer

## API Endpoints

### Authentication:
- **`Get /Authenticated`**: Check if the user is authenticated
- **`POST /login`**: User login
- **`POST /logout`**: User logout
- **`POST /register`**: User registration
### User Profile:
- **`GET /profile`**: Get user profile information
- **`POST /update-profile`**: Update user profile
### Plants:
- **`GET /api-plant-search`**: Search for plants by name and state
- **`GET /api-plant-info`**: Get detailed information about a specific plant
- **`GET /api-saved-plants`**: Get user's saved plants
- **`POST /api-save-plant`**: Save a plant to user's profile
### Posts:
- **`GET /api/posts`**: Get all community posts
- **`POST /api/create-post`**: Create a new post

## `front-end` Folder
The front-end of GrowZone provides an interface for users to explore plants, manage their accounts, and interact with the community.
### Structure of the front-end folder
```
front-end/
├──
```
## `back-end` Folder
The back-end of GrowZone powers the application with a RESTful API, database management, and integration with external plant data sources
### Structure of the back-end folder
```
back-end/
├──
```
## Key Principles and Design choices
-
## Deployment
- This application is designed to be deployed to Azure App Service

  ### To run locally instead
  1. Clone this repository
  2. Open index.html in a browser
  3. For API requests to work, ensure the backend is running on the configured URL
## Acknowledgements
- USDA Plants database for providing plant informaiton
- Team members who helped to build this applicaiton (Group 4)

 this is what the "code" for the file structure looks like
```
backend/
├── config/                # Configuration files, including database setup
│   └── db.js              # Establishes connection to the database
├── middleware/            # Middleware functions for validation, authentication, logging
│   ├── authMiddleware.js  # Middleware to ensure user is authenticated
│   └── validate.js        # Middleware for validating request data
├── routes/                # API route definitions for different backend functionalities
│   ├── auth.js            # Routes for user authentication
│   └── stac.js            # Routes for data retrieval from external APIs
├── get_temperature_data.py # Python script to retrieve NOAA temperature data
├── index.js               # Main entry point for the Express server
└── README.md              # Documentation for the backend folder
```

