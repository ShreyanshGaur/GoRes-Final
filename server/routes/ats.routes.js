const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkAtsScore, getScanHistory } = require('../controllers/ats.controller'); // <-- Import new function
const { protect } = require('../middleware/auth.middleware');

// Configure multer for memory storage (to handle file as a buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// @route   POST /api/ats/check
// This route is protected by the 'protect' middleware.
// It uses 'upload.single('resume')' to handle a single file upload with the field name 'resume'.
router.post('/check', protect, upload.single('resume'), checkAtsScore);

// @route   GET /api/ats/history
// This route gets all past scans for the logged-in user.
router.get('/history', protect, getScanHistory); // <-- ADD THIS LINE

module.exports = router;