# MapNMeet35L

MapNMeet35L is a web application that helps UCLA students connect and organize activities on campus. Users can create, join, and discover activities happening around UCLA, with features including Google Maps integration, user profiles, activity management, and real-time notifications.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (v6 or higher)
- [Git](https://git-scm.com/downloads)
- A Google Cloud Platform account (for Maps API and OAuth)
- A UCLA email and access to UCLA_WIFI/eduroam/UCLA VPN connection

## Setup Instructions

### 0. IMPORTANT: CONNECT TO EDUROAM OR UCLA_WIFI OR UCLA VPN, run into CORS problems otherwise (if you use UCLA_WEB or non UCLA authenticated wifi) 
This is to ensure only UCLA students can use our application, for security purposes. In addition, when signing into the application, use your UCLA email.

### 1. Clone the Repository
```bash
git clone https://github.com/aadrijupadya/MapNMeet35L.git
cd MapNMeet35L
```

### 2. Environment Setup

#### Server Environment
1. Navigate to the server directory:
```bash
cd server
```

2. Create a `.env` file in the server directory with the following variables:
```env
# MongoDB Connection String - Get this from MongoDB Atlas or your local MongoDB instance
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# JWT Secret - Create a strong random string for your deployment
JWT_SECRET=your_secure_random_string

# Google OAuth Credentials - Get these from Google Cloud Console
# 1. Go to https://console.cloud.google.com
# 2. Create a new project or select existing one
# 3. Enable Google OAuth API
# 4. Create OAuth 2.0 credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server Port (default: 8000)
PORT=8000
```

#### Client Environment
1. Navigate to the client directory:
```bash
cd ../client
```

2. Create a `.env` file in the client directory with:
```env
# Google Maps API Key - Get this from Google Cloud Console
# 1. Go to https://console.cloud.google.com
# 2. Enable Maps JavaScript API
# 3. Create credentials for Maps API
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Install Dependencies

#### Server Dependencies
```bash
cd ../server
npm install
```

#### Client Dependencies
```bash
cd ../client
npm install
```

### 4. Database Setup
1. Make sure MongoDB is running on your system
2. The application will automatically create necessary collections when it starts

### 5. Running the Application

#### Start the Server
```bash
cd ../server
node server.js
```
The server will start on http://localhost:8000

#### Start the Client
In a new terminal:
```bash
cd ../client
npm start
```
The client will start on http://localhost:3000

## Features
- User authentication with Google OAuth
- Create and manage activities
- Interactive map interface for activity locations
- User profiles with activity history
- Real-time notifications
- Activity search and filtering
- Dark/Light theme support

## API Endpoints

### Authentication
- POST `/api/auth/google` - Google OAuth authentication
- GET `/api/auth/validate` - Validate user session

### Activities
- GET `/api/activities` - Get all activities
- POST `/api/activities` - Create new activity

## Troubleshooting

### Common Issues
1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check your connection string in server/.env
   - Make sure Wifi/VPN is properly set up as in step zero.

2. **Google Maps Not Loading**
   - Verify your Google Maps API key in client/.env
   - Ensure the API key has Maps JavaScript API enabled

3. **Authentication Issues**
   - Check Google OAuth credentials in both .env files
   - Ensure correct redirect URIs in Google Cloud Console

### Getting Help
If you encounter any issues not covered here, please:
1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check if MongoDB is running

## Contributing
This is a course project for CS 35L at UCLA. For any questions or issues, please contact the developers for this project at aadriju01@g.ucla.edu, 
dtritasavit@g.ucla.edu, akhileshb@g.ucla.edu, antquin36@g.ucla.edu, adraj@g.ucla.edu.

## Note for CS 35L Submission
For grading purposes, the submission tarball will include the necessary `.env` files with actual values. These files are not included in the git repository for security reasons, but are provided in the submission to allow graders to run the application locally.

