const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Import routes
const foodRoutes = require('./routes/foodRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - update CORS for production
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://192.168.31.155:3000',
        process.env.FRONTEND_URL // Will be set in Render
    ].filter(Boolean), // Remove any undefined values
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint (important for Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Routes
app.use('/api/food', foodRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});