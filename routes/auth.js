const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');

// Validation rules
const registerValidation = [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').isMobilePhone().withMessage('Please enter a valid phone number')
];

// Routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/register', authController.showRegister);
router.get('/register-elder', authController.showElderRegister);
router.post('/register', registerValidation, authController.register);
router.post('/logout', authController.logout);

module.exports = router;
