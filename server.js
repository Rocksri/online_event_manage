require('dotenv').config();
const swaggerSetup = require('./swagger');
const cookieParser = require('cookie-parser'); // Import cookie-parser
const path = require('path'); // Add this line


// Validate critical environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'STRIPE_SECRET_KEY'];
requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
        console.error(`Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
});

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const userRoutes = require('./routes/userRoutes'); // Your new user routes file
const uploadRoutes = require('./routes/uploadRoutes'); // Assuming path
const helpdeskRoutes = require('./routes/helpdeskRoutes');


const app = express();

// Connect to database
connectDB();

// CORS Configuration
const corsOptions = {
    origin: [process.env.FRONTEND_URL, process.env.BACKEND_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // Apply CORS middleware
app.use(express.json());
app.use(cookieParser()); // Use cookie-parser middleware
swaggerSetup(app);


// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Adjust __dirname if your server.js is not in root


// Log environment status
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('MongoDB URI:', process.env.MONGO_URI ? 'Set' : 'Not Set');
console.log('JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Not Set');
console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? 'Set' : 'Not Set');


// Routes
app.use('/api/users', userRoutes); // Mount your user routes under /api/users
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes); // All upload routes will be prefixed with /api/upload
app.use('/api/helpdesk', helpdeskRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));