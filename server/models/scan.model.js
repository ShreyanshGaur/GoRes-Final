const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const scanSchema = new Schema({
    // Link the scan to a specific user
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // This creates a reference to the User model
    },
    jobDescription: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true
    },
    matchedKeywords: {
        type: [String], // Defines an array of strings
        default: []
    },
    suggestions: {
        type: [String],
        default: []
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

const Scan = mongoose.model('Scan', scanSchema);

module.exports = Scan;