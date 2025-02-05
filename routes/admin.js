// routes/admin.js
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const verifyToken = require('../middleware/adminAuth');
const db = require('../config/db');
const router = express.Router();

// Route for admin login page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/login.html'));
});

// Route for admin dashboard page
router.get('/dashboard', verifyToken, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/admin/dashboard.html'));
});

// Admin login logic
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query the database for the user
        db.query('SELECT * FROM admins WHERE username = ?', [username], async (err, results) => {
            if (err) {
                console.error('Database query error:', err);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (results.length > 0) {
                const user = results[0];

                // Compare the provided password with the hashed password in the database
                const match = await bcrypt.compare(password, user.password);
                if (match) {
                    const token = jwt.sign({ id: user.id, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
                    // res.cookie('authToken', token, { httpOnly: true }); #dev
                    res.cookie('authToken', token, { httpOnly: true, sameSite: 'Strict', secure: false });

                    return res.status(200).json({ message: 'Login successful!' }); // Send a success response
                } else {
                    return res.status(401).json({ message: 'Invalid username or password' });
                }
            } else {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
