const User = require('../models/user.model');
const Scan = require('../models/scan.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- SIGN UP CONTROLLER ---
const signupUser = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
        });
        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- LOGIN CONTROLLER ---
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- GOOGLE SIGN-IN CONTROLLER ---
const googleSignIn = async (req, res) => {
    const { credential, type } = req.body; // 'type' can be 'login' or 'signup'
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name: username, picture } = payload;

        let user = await User.findOne({ email });

        if (type === 'login') {
            if (!user) {
                return res.status(404).json({ message: 'This email is not registered. Please sign up first.' });
            }
        } else if (type === 'signup') {
            if (user) {
                return res.status(400).json({ message: 'This email is already registered. Please log in.' });
            }
            const randomPassword = Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);
            
            user = await User.create({
                googleId,
                username,
                email,
                password: hashedPassword,
            });
        } else {
            return res.status(400).json({ message: 'Invalid request type.' });
        }
        
        res.status(200).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            picture: user.picture || payload.picture, // Send back picture URL
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error('Google Sign-In Error:', error);
        res.status(401).json({ message: 'Google Sign-In failed. Invalid token.' });
    }
};

// --- UPDATE USER PROFILE CONTROLLER ---
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            user.username = req.body.username || user.username;
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }
            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                username: updatedUser.username,
                email: updatedUser.email,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- DELETE USER CONTROLLER ---
const deleteUser = async (req, res) => {
    try {
        const userId = req.user._id;
        await Scan.deleteMany({ userId: userId });
        await User.findByIdAndDelete(userId);
        res.status(200).json({ success: true, message: 'Account and all associated data deleted successfully.' });
    } catch (error) {
        console.error("Error deleting account:", error);
        res.status(500).json({ message: 'Server error while deleting account.' });
    }
};

// --- FORGOT PASSWORD CONTROLLER ---
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    console.log(`[Forgot Password] Request received for email: ${email}`); // DEBUG LOG

    try {
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`[Forgot Password] User with email ${email} not found. Sending generic success response.`); // DEBUG LOG
            return res.status(200).json({ message: 'If an account with this email exists, a new password has been sent.' });
        }

        console.log(`[Forgot Password] User found: ${user.username}. Generating new password.`); // DEBUG LOG

        const randomPassword = Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(randomPassword, salt);
        await user.save();

        console.log(`[Forgot Password] New password saved to database. Preparing to send email...`); // DEBUG LOG

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Your New GoRes Password',
            text: `Hello ${user.username},\n\nYour new temporary password for GoRes is: ${randomPassword}\n\nPlease log in with this password and change it in your profile settings immediately.\n\nThank you,\nThe GoRes Team`
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Forgot Password] Email sent successfully to ${user.email}.`); // DEBUG LOG

        res.status(200).json({ message: 'If an account with this email exists, a new password has been sent.' });

    } catch (error) {
        // THIS WILL SHOW US THE EXACT EMAIL ERROR
        console.error("[Forgot Password] CRITICAL ERROR:", error); 
        res.status(500).json({ message: 'An error occurred while trying to reset the password.' });
    }
};

// --- Helper Function to Generate JWT ---
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = {
    signupUser,
    loginUser,
    googleSignIn,
    updateUserProfile,
    deleteUser,
    forgotPassword,
};