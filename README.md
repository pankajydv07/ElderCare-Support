# ElderCare Support Portal  --  https://eldercare-support.onrender.com/

A comprehensive web application connecting elderly individuals with volunteers for various assistance services. The platform features location-based matching, real-time request management, and integrated Google Maps functionality.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure registration and login system for elders, volunteers, and administrators
- **Role-Based Access Control**: Different interfaces and permissions for each user type
- **Location-Based Matching**: Google Maps integration with 10km radius volunteer matching
- **Request Management**: Complete CRUD operations for assistance requests
- **Real-Time Status Updates**: Track request progress from creation to completion
- **Profile Management**: Comprehensive user profiles with location editing

### Advanced Features
- **Interactive Maps**: Google Maps API integration with autocomplete and GPS detection
- **Distance Calculation**: Haversine formula implementation for accurate distance measurements
- **Admin Dashboard**: Analytics, user verification, and request management
- **Responsive Design**: Bootstrap 5 for mobile-friendly interface
- **File Upload Support**: Profile pictures and document management
- **Session Management**: Secure session handling with MongoDB storage

## 🚀 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **Express Session** - Session management
- **bcryptjs** - Password hashing
- **Method Override** - RESTful routing support

### Frontend
- **EJS** - Templating engine
- **Bootstrap 5** - CSS framework
- **Google Maps JavaScript API** - Maps and location services
- **Bootstrap Icons** - Icon library

### Development Tools
- **Nodemon** - Development server
- **dotenv** - Environment variable management
- **Express Validator** - Input validation
- **Multer** - File upload handling

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Google Maps API key

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd eldercare
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eldercare

# Session Secret
SESSION_SECRET=your-super-secret-session-key

# Google Maps API Key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Step 4: Database Setup
The application will automatically connect to MongoDB Atlas. Ensure your MongoDB cluster allows connections from your IP address.

### Step 5: Start the Application
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 🗂️ Project Structure

```
eldercare/
├── app.js                  # Main application file
├── package.json           # Dependencies and scripts
├── README.md             # Project documentation
├── .env                  # Environment variables (create this)
├── config/
│   └── database.js       # Database connection
├── controllers/
│   ├── adminController.js     # Admin functionality
│   ├── authController.js      # Authentication logic
│   ├── elderController.js     # Elder user operations
│   └── volunteerController.js # Volunteer operations
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   ├── User.js           # User model (elders, volunteers, admins)
│   ├── Request.js        # Assistance request model
│   └── Feedback.js       # Feedback model
├── public/
│   ├── css/
│   │   └── style.css     # Custom styles
│   ├── js/
│   │   └── main.js       # Client-side JavaScript
│   └── images/           # Static images
├── routes/
│   ├── admin.js          # Admin routes
│   ├── api.js            # API endpoints
│   ├── auth.js           # Authentication routes
│   ├── elder.js          # Elder routes
│   └── volunteer.js      # Volunteer routes
├── uploads/              # File upload directory
├── utils/
│   └── authHelpers.js    # Authentication utilities
└── views/
    ├── layouts/
    │   └── main.ejs      # Main layout template
    ├── partials/
    │   ├── header.ejs    # Header component
    │   ├── navbar.ejs    # Navigation component
    │   └── footer.ejs    # Footer component
    ├── auth/
    │   ├── login.ejs     # Login page
    │   ├── register.ejs  # Registration page
    │   └── register-elder.ejs # Elder registration
    ├── admin/
    │   ├── dashboard.ejs # Admin dashboard
    │   ├── analytics.ejs # Analytics page
    │   ├── manage-requests.ejs # Request management
    │   └── verify-volunteers.ejs # Volunteer verification
    ├── elder/
    │   ├── dashboard.ejs # Elder dashboard
    │   ├── profile.ejs   # Elder profile management
    │   ├── create-request.ejs # Request creation
    │   ├── my-requests.ejs # Request history
    │   └── feedback.ejs  # Feedback form
    ├── volunteer/
    │   ├── dashboard.ejs # Volunteer dashboard
    │   ├── profile.ejs   # Volunteer profile
    │   ├── browse-requests.ejs # Available requests
    │   └── my-tasks.ejs  # Assigned tasks
    ├── index.ejs         # Landing page
    └── error.ejs         # Error page
```

## 🔧 Configuration

### Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Add the API key to your `.env` file

### MongoDB Atlas Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user with read/write permissions
4. Configure network access (allow your IP)
5. Get connection string and add to `.env` file

## 🎯 Usage

### For Elders
1. **Registration**: Sign up with location detection or manual entry
2. **Profile Setup**: Complete profile with emergency contacts and preferences
3. **Create Requests**: Submit assistance requests with details and urgency
4. **Track Progress**: Monitor request status and volunteer assignment
5. **Provide Feedback**: Rate and review completed services

### For Volunteers
1. **Registration**: Sign up and complete verification process
2. **Profile Management**: Add skills, availability, and service areas
3. **Browse Requests**: View nearby requests within 10km radius
4. **Accept Tasks**: Take on requests that match your skills
5. **Update Status**: Mark tasks as in-progress or completed

### For Administrators
1. **Dashboard Overview**: Monitor platform statistics and activity
2. **User Management**: Verify volunteers and manage user accounts
3. **Request Oversight**: Monitor and manage all assistance requests
4. **Analytics**: View platform usage and performance metrics

## 🔐 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Session Management**: Secure session handling with MongoDB storage
- **Input Validation**: Server-side validation for all forms
- **Role-Based Access**: Route-level authentication and authorization
- **CSRF Protection**: Method override for secure form submissions

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

### Elder Routes
- `GET /elder/dashboard` - Elder dashboard
- `GET /elder/profile` - View profile
- `PUT /elder/profile` - Update profile
- `GET /elder/create-request` - Request creation form
- `POST /elder/requests` - Create new request
- `GET /elder/my-requests` - View user's requests

### Volunteer Routes
- `GET /volunteer/dashboard` - Volunteer dashboard
- `GET /volunteer/profile` - View profile
- `PUT /volunteer/profile` - Update profile
- `GET /volunteer/browse-requests` - Browse available requests
- `POST /volunteer/accept-request/:id` - Accept request
- `GET /volunteer/my-tasks` - View assigned tasks

### Admin Routes
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/analytics` - Platform analytics
- `GET /admin/manage-requests` - Request management
- `GET /admin/verify-volunteers` - Volunteer verification

## 🚀 Deployment

### Production Environment
1. Set `NODE_ENV=production` in environment variables
2. Use a process manager like PM2 for Node.js
3. Configure reverse proxy with Nginx
4. Set up SSL certificates
5. Configure database backup strategy

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=your-production-mongodb-uri
SESSION_SECRET=strong-production-secret
GOOGLE_MAPS_API_KEY=your-api-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For support, email support@eldercare.com or create an issue in the repository.

## 🎉 Acknowledgments

- Google Maps API for location services
- Bootstrap team for the responsive framework
- MongoDB Atlas for cloud database hosting
- All contributors and volunteers who make this platform possible

---

**ElderCare Support Portal** - Connecting communities, one helping hand at a time. 🤝❤️
