const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const express = require('express'); // Don't forget to import express!
const supabase = require('../config/supabase'); // Check your actual config path

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// User registration
router.post('/register', async (req, res) => {
    try {
        const { email, password, username, role } = req.body;

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    role: role || 'user'
                }
            }
        });

        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current user
router.get('/user', async (req, res) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// User logout
router.post('/logout', async (req, res) => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        res.status(200).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;