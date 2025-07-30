const User = require('../models/User');
const { validationResult } = require('express-validator');

const authController = {
    // Show login page
    showLogin: (req, res) => {
        res.render('auth/login', { error: null });
    },

    // Handle login
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            
            const user = await User.findOne({ email });
            if (!user) {
                return res.render('auth/login', { error: 'Invalid email or password' });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.render('auth/login', { error: 'Invalid email or password' });
            }

            req.session.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            // Redirect based on role
            switch (user.role) {
                case 'elder':
                    res.redirect('/elder/dashboard');
                    break;
                case 'volunteer':
                    res.redirect('/volunteer/dashboard');
                    break;
                case 'admin':
                    res.redirect('/admin/dashboard');
                    break;
                default:
                    res.redirect('/');
            }
        } catch (error) {
            console.error(error);
            res.render('auth/login', { error: 'An error occurred during login' });
        }
    },

    // Show registration page
    showRegister: (req, res) => {
        res.render('auth/register', { error: null });
    },

    // Show elder registration page
    showElderRegister: (req, res) => {
        res.render('auth/register-elder', { error: null });
    },

    // Handle registration
    register: async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                const renderPage = req.body.role === 'elder' ? 'auth/register-elder' : 'auth/register';
                return res.render(renderPage, { error: errors.array()[0].msg });
            }

            const { 
                name, email, password, phone, role, bio, serviceableLocations, age,
                fullAddress, latitude, longitude, city, state, zipCode 
            } = req.body;

            // Validate that coordinates are provided
            if (!latitude || !longitude) {
                const renderPage = req.body.role === 'elder' ? 'auth/register-elder' : 'auth/register';
                return res.render(renderPage, { error: 'Please select a valid address from the suggestions' });
            }

            // Check if user already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                const renderPage = req.body.role === 'elder' ? 'auth/register-elder' : 'auth/register';
                return res.render(renderPage, { error: 'Email already registered' });
            }

            const userData = {
                name,
                email,
                password,
                phone,
                role,
                address: {
                    fullAddress,
                    city,
                    state,
                    zipCode,
                    coordinates: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude)
                    }
                }
            };

            if (role === 'volunteer') {
                userData.bio = bio;
                userData.serviceableLocations = serviceableLocations ? serviceableLocations.split(',').map(loc => loc.trim()) : [];
            } else if (role === 'elder') {
                userData.age = age;
            }

            const user = new User(userData);
            await user.save();

            req.session.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            };

            // Redirect based on role
            switch (user.role) {
                case 'elder':
                    res.redirect('/elder/dashboard');
                    break;
                case 'volunteer':
                    res.redirect('/volunteer/dashboard');
                    break;
                default:
                    res.redirect('/');
            }
        } catch (error) {
            console.error(error);
            const renderPage = req.body.role === 'elder' ? 'auth/register-elder' : 'auth/register';
            res.render(renderPage, { error: 'An error occurred during registration' });
        }
    },

    // Handle logout
    logout: (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error(err);
            }
            res.redirect('/');
        });
    }
};

module.exports = authController;
