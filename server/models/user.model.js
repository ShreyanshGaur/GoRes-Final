const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    // This field will store the user's Google ID if they sign up with Google
    googleId: {
        type: String,
        default: null
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const User = mongoose.model('User', userSchema);

module.exports = User;