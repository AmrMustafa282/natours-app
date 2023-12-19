const express = require('express');
const router = express.Router();

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require('../controllers/tourController');

const { protect, restrictTo } = require('../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes')


// Nested Routes with express
router.use('/:tourId/reviews', reviewRouter)



// Aliasing
router.route('/top-5-cheap')
  .get(aliasTopTours, getAllTours);
// Aggregation pipline [$match and $group]
router.route('/tour-stats')
  .get(getTourStats);
// Aggregation pipline [$Unwinding and $Projecting]
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('admin', 'lead-guide','guide'), getMonthlyPlan);

//GeoSpatial route
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(getToursWithin)

router
  .route('/distances/:latlng/unit/:unit')
  .get(getDistances)


router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('admin', 'lead-guide'), createTour);
  
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('admin', 'lead-guide'),
    uploadTourImages,
    resizeTourImages,
    updateTour
  )
  .delete(protect, restrictTo('admin', 'lead-guide'), deleteTour);




module.exports = router;
