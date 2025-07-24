const express = require('express');
const router = express.Router();
const { signupUser, loginUser, updateUserProfile, deleteUser, googleSignIn, forgotPassword } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/google', googleSignIn);
router.post('/forgot-password', forgotPassword);

// Private routes
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUser);

module.exports = router;