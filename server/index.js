require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectToDatabase = require('./config/database');
const authenticationRoutes = require('./routes/authenticationRoutes');
const tripRoutes = require('./routes/tripRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const exportRoutes = require('./routes/exportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectToDatabase();

// ── CORS: allow Vercel frontend + local dev ──
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  // Production: set FRONTEND_URL env var on Render to your Vercel URL
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Also allow any *.onrender.com or *.vercel.app for convenience
    if (/\.onrender\.com$/.test(origin) || /\.vercel\.app$/.test(origin)) return callback(null, true);
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100 to 500 — GPS tracking apps send many location points
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests from this IP, please try again after 15 minutes' }
});

app.use('/api/', apiLimiter);

app.use('/api/auth', authenticationRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (request, response) => {
  response.send('NATPAC Travel Data Collection API is running...');
});

const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
