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

app.use(cors());
app.use(express.json());

const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
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
