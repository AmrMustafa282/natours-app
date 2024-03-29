const express = require('express');
const router = express.Router();

const {isLoggedIn, protect} = require('./../controllers/authController')

const {
  getOverview,
  getTour,
  getLoginForm,
  getSignupForm,
  getForgotPasswordForm,
  getResetPassowrdForm,
  getAccount,
  updateUserData,
  getMyTours,
  alerts,
} = require('./../controllers/viewController');

// const {createBookingCheckout} = require('./../controllers/bookingController')
// router.use(isLoggedIn);

router.use(alerts);

// router.get('/',createBookingCheckout, isLoggedIn,getOverview);
router.get('/', isLoggedIn,getOverview);
router.get('/tour/:slug', isLoggedIn,getTour);
router.get('/auth/login',isLoggedIn, getLoginForm);
router.get('/auth/signup',isLoggedIn, getSignupForm);
router.get('/auth/forgot-password', isLoggedIn, getForgotPasswordForm);
router.get('/auth/reset-password', isLoggedIn, getResetPassowrdForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);
// router.get('/my-tours', protect, getMyTours);

router.post('/submit-user-data', protect ,updateUserData)

module.exports = router;