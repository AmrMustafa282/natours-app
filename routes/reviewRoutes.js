const express = require('express');
const router = express.Router({mergeParams:true});

const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('./../controllers/reviewController');

const {
  protect,
  restrictTo
} = require('./../controllers/authController')


// POST /tour/234fad4/reviews
// POST /reviews
// GET /tour/234fad4/reviews
// GET /reviews

router.use(protect)

router
  .route('/')
  .get(getAllReviews)
  .post( restrictTo('user'), setTourUserIds, createReview)

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user','admin'), updateReview)
  .delete(restrictTo('user','admin'), deleteReview);

module.exports = router;