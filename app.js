const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const dotenv = require('dotenv');
const compression = require('compression')
dotenv.config({ path: './config.env' });
const cors = require('cors')

// const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');

const cookieParser = require('cookie-parser');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
const { webhookCheckout } = require('./controllers/bookingController');

const app = express();
app.enable('trust proxy');
app.use(cors()) // cross origin resource sharing [allow everyone]
// app.use(cors({origin:'https://www.natours.com'})) [only allow usin this domain]
// simple reqs => get , post
// non simple reqs => put patch delete or reqs that has cookies
app.options('*', cors()); 
// app.options('api/v1/tours/:id', cors()); // and again we can allow this non-simpeo for spacific route


app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Global Middleware
app.use(express.static(path.join(__dirname, 'public'))); // Serving static files
// 1) set Security HTTP headers

// our app.use take a function not a call of function but this call will return a function
 app.use(helmet());




// 2) set Limite reqs from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // this means 100 req per one hour for the same ip
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Middleware
// Builtin Middleware

// Stripe webhook route
app.use(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout); // we want it not in json but in a row formate


app.use(express.json({ limit: '10kb' })); // Body parser, reading data from body into req.body

// Data sanitization against NoSQL query injection
app.use(mongoSanitize()); // this will filter any NoSQL quear

// Data sanitization against XSS
app.use(xss()); // this will clean the input from any malicious html code

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '10kb',
  })
); // parsing form data
app.use(cookieParser()); // Parse Cookie header and populate req.cookies

app.use((req, res, next) => {
  // Test Middelware
  req.requestTime = new Date().toISOString();
  // console.log(req.headers)
  next();
});

app.use(compression())

// DEVELOPMENT logging
// 3rd party Middleware for debuging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}



// Template Routes
app.use('/', viewRouter);

// RESTfull Routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

// Handling unhandeld Routes [Operational Error]
// app.all('*', (req, res, next) => {
//   // res.status(404).json({
//   //   status: 'fail',
//   //   message:`Cant find ${req.originalUrl} on this server!`
//   // })

//   // const err = new Error(`Cant fint ${req.originalUrl} on this server!`);
//   // err.status = 'fail';
//   // err.statusCode = 404;

//   next(new AppError(`Cant find ${req.originalUrl} on this server!`, 404));
// });

// Error Handler Middelware (Globl)
app.use(errorController);

module.exports = app;
