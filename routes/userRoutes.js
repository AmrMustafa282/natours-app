const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUser,
  updateUser,
  deletUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto
} = require('../controllers/userContorller');

const {
  signup,
  login,
  protect,
  forgotPassword,
  resetPassword,
  updatePassword,
  sendConfirmation,
  confirmEmail,
  restrictTo,
  logout,
} = require('../controllers/authController');



router.post('/signup', signup)
router.post('/login', login)
router.get('/logout', logout);

router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

router.post('/sendConfirmation', protect,sendConfirmation); // user = req.user from protect works as document so it deals with the instance methods
router.get('/confirmEmail/:token', confirmEmail);


// this is gonna work as a Middelware so, anything after this is gonne be protected
router.use(protect);

router.patch('/updateMyPassword/', updatePassword);

router.get('/me', getMe, getUser) 
router.patch('/updateMe/', uploadUserPhoto, resizeUserPhoto, updateMe);
router.delete('/deleteMe/', deleteMe);

router.use(restrictTo('admin'))

router
  .route('/')
  .get(getAllUsers)

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deletUser);


module.exports = router;