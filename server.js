//sever.js
const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const {xss} = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');

dotenv.config({path:'./config/config.env'});

connectDB();
//Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100
});

const restaurants = require('./routes/restaurants');

const reservations = require('./routes/reservations');

const reviews = require('./routes/reviews');

const auth = require('./routes/auth');

const app = express();
//Body parser
app.use(express.json());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(limiter);
app.use(hpp());
app.use(cors());

app.use('/api/v1/restaurants', restaurants);
app.use('/api/v1/reservations', reservations);
app.use('/api/v1/reviews', reviews);
app.use('/api/v1/auth', auth);
//Error handler
const PORT = process.env.PORT || 5003;
const server = app.listen(PORT, () => {
  console.log('Server running in', process.env.NODE_ENV, 'mode on port', PORT);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Please stop the existing process or change PORT in config/config.env.`);
    process.exit(1);
  }
  console.log(`Server error: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
    console.log(`Error ${err.message}`);
    server.close(() => process.exit(1));
})