const AppError = require('./../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const Email = require('./../utils/email');
const crypto = require('crypto');
const axios = require('axios');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode,red, res) => {
  const token = signToken(user._id);

  // remove the password from the output but wont save it to the document
  user.password = undefined;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // cookie can NOT be accessed or modired anyway by the browser
    secure: req.secure || req.headers('x-forwarded-proto')==='https' // set secure on secure connection of in heroku by headers
  };
  // if (req.secure || req.headers('x-forwarded-proto')==='https') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // we wrote it like this to avoid marking all users as admin
  // and admin will be a normal user but we mark it from campas after creating it

    const newUser = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      // role: req.body.role,
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
 

  // Account needs to be varified first before we can send SMS
  // const options = {
  //   method: 'POST',
  //   url: 'https://api.brevo.com/v3/transactionalSMS/sms',
  //   headers: {
  //     accept: 'application/json',
  //     'content-type': 'application/json',
  //     'api-key':
  //       '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',
  //   },
  //   data: {
  //     type: 'transactional',
  //     unicodeEnabled: false,
  //     sender: 'Natours',
  //     recipient: '201060921624',
  //     content: 'welcome to natours family!',
  //     organisationPrefix: 'Natours',
  //   },
  // };

  // axios
  //   .request(options)
  //   .then(function (response) {
  //     console.log(response.data);
  //   })
  //   .catch(function (error) {
  //     console.error(error);
  //   });

  // to delete the passowrd before returning the res
  // const { password, ...newUserObj } = newUser._doc;

  // const token = signToken(newUser._id);

  // Store the token in a cookie
  // res.cookie('jwt', token, {
  //   httpOnly: true, // Cookie cannot be accessed via client-side scripts
  //   secure: true, // This is usually set in production for HTTPS
  //   // other options as needed (e.g., maxAge, domain, path)
  // });

  createSendToken(newUser, 201,req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if email and password exist

  if (!email || !password) {
    return next(new AppError('Please provide the email and password!', 400));
  }
  // 2) check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password!', 401)); // 401 unAuthorized
  }

  // 3) if everything is fine , send token to client

  createSendToken(user, 200,req, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if its exitst
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do NOT have permission to perform this action', 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordRest();

    res.status(200).json({
      status: 'success',
      massage: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email,Try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });

  // 2) if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update chngedPasswordAt prop for the user
  // we did this step in userModel by useing document middelware [pre]

  // 4) Log the user in, sent JWT
  createSendToken(user, 200,req, res);
});

exports.sendConfirmation = catchAsync(async (req, res, next) => {
  // 1) Get user based on current user id
  // const user = await User.findOne({email:req.body.email});
  // if (!user) {
  //   return next(new AppError('There is no user with that email address', 404));
  // }
  const { user } = req;
  if (user.isConfirmed) {
    return next(new AppError('THIS USER IS ALREADY CONFIRMED', 400));
  }
  // 2) Generate the random reset token
  const confirmToken = user.createEmailConfirmToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const confirmURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/sendConfirmation/${confirmToken}`;

  const message = `Confirm your email? Submit a POST request to: ${confirmURL}`;
  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your confirmation token (valid for 10 min)',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      massage: 'Token sent to email!',
    });
  } catch (err) {
    user.emailConfirmToken = undefined;
    user.emailConfirmExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email,Try again later!', 500)
    );
  }
});

// not portectd for now but i think it should be
exports.confirmEmail = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    emailConfirmToken: hashedToken,
    emailConfirmExpires: {
      $gt: Date.now(),
    },
  });
  // 2) if token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.isConfirmed = true;
  user.emailConfirmToken = undefined;
  user.emailConfirmExpires = undefined;
  await user.save();
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if the POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in , sent JWT
  createSendToken(user, 200,req, res);
});
