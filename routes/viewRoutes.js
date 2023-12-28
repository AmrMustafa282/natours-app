const express = require('express');
const router = express.Router();

const {isLoggedIn, protect} = require('./../controllers/authController')

const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  updateUserData,
  getMyTours,
} = require('./../controllers/viewController');

// const {createBookingCheckout} = require('./../controllers/bookingController')
// router.use(isLoggedIn);

// router.get('/',createBookingCheckout, isLoggedIn,getOverview);
router.get('/tour/:slug', isLoggedIn,getTour);
router.get('/auth/login',isLoggedIn, getLoginForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

router.post('/submit-user-data', protect ,updateUserData)

module.exports = router;