// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// MODIFIED LINE: Tell dotenv to look for a file named 'key.env'
require('dotenv').config({ path: './key.env' }); 

// --- Route Imports ---
const userRoutes = require('./routes/user.routes');
const atsRoutes = require('./routes/ats.routes');

// --- !! DEBUGGING LINE !! ---
// This will print the value of MONGO_URI to your terminal.
// If it prints "undefined", the .env file is not being read correctly.
console.log('MONGO_URI from key.env:', process.env.MONGO_URI);
// -----------------------------

// Initialize the Express app
const app = express();

// --- Middleware Setup ---
app.use(cors()); 
app.use(express.json()); 

// --- Database Connection ---
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB database connection established successfully");
});

// --- API Route Handling ---
app.use('/api/users', userRoutes); 
app.use('/api/ats', atsRoutes);

// A simple base route to confirm the server is running
app.get('/', (req, res) => {
    res.send('GoRes Backend is running!');
});


// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});