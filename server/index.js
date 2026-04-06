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

app.use('/api/auth', authenticationRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (request, response) => {
  response.send('NATPAC Travel Data Collection API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
