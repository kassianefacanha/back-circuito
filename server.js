const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const uploadRoutes = require('./routes/uploadRoutes');
const driveRoutes = require('./routes/driveRoutes');

// Load env vars
require('dotenv').config();

// Connect to database
connectDB();

// Route files
const auth = require('./routes/authRoutes');
const teams = require('./routes/teamRoutes');
const news = require('./routes/newsRoutes');
const scoreboards = require('./routes/scoreboardRoutes');
const matches = require('./routes/matchRoutes');
const stats = require('./routes/statsRoutes');
const userRoutes = require('./routes/userRoutes');


const app = express();

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10000, // limite aumentado para 10000 requisições por IP
  message: {
    success: false,
    error: 'Muitas requisições deste IP, por favor tente novamente mais tarde'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Pular rate limiting para rotas críticas ou para admin
    return req.path === '/api/v1/auth/login' || 
           req.path === '/api/v1/auth/register' ||
           req.user?.role === 'admin';
  }
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/teams', teams);
app.use('/api/v1/news', news);
app.use('/api/v1/scoreboards', scoreboards);
app.use('/api/v1/matches', matches);
app.use('/api/v1/stats', stats);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/drive', driveRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});