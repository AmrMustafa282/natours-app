

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    // console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

const signup = async (name,email,password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm
      },
    });
    // console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Registed Successfully');
      window.setTimeout(() => {
        location.assign('/auth/login');
      }, 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

const forgotPassowrd = async (email) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/forgotPassword',
      data: {
        email,
      },
    });
    // console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', 'Token sent to you Email, Please chack you Email.');
      window.setTimeout(() => {
        location.assign('/auth/login');
      }, 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
}

const resetPassowrd = async (password, passwordConfirm,token) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/resetPassword/${token}`,
      data: {
        password,
        passwordConfirm
      },
    });
    console.log(res);
    if (res.status === 200 || res.data.status === 'success') {
      showAlert('success', 'Password Rest Successfully.');
      window.setTimeout(() => {
        location.assign('/auth/login');
      }, 1500);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

const sendConfirmationToEmail = async () => {
    try {
      const res = await axios({
        method: 'POST',
        url: `/api/v1/users/sendConfirmation`,
      });
      // console.log(res);
      if (res.status === 200 || res.data.status === 'success') {
        showAlert('success', 'Confimation Sent To Your Email Successfully.');
      }
    } catch (e) {
      showAlert('error', e.response.data.message);
    }
}

// const accountConfirmation = async (url) => {
//   try {
//     const res = await axios({
//       method: 'POST',
//       url
//     });
//     // console.log(res);
//     if (res.status === 200 || res.data.status === 'success') {
//       showAlert('success', 'Confimation Sent To Your Email Successfully.');
//       // window.setTimeout(() => {
//       //   location.assign(host);
//       // }, 1500);
//     }
//   } catch (e) {
//     showAlert('error', e.response.data.message);
//   }
// }

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    if ((res.data.status = 'success')) location.assign('/');
  } catch (e) {
    showAlert('error', 'Error logging out try again.');
  }
};

// type is either password or data
const updateSettings = async (data, type) => {
  try {
    const route = type === 'password' ? 'updateMyPassword' : 'updateMe';

    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${route}`,
      data,
    });
    // console.log(res);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} Updated Successfully`);
      // window.setTimeout(() => {
      //   location.assign('/auth/login');
      // }, 1000);
    }
  } catch (e) {
    showAlert('error', e.response.data.message);
  }
};

const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51ONhCnDQFtpqFCDZnMTeC6FTUMaIJsDNFUUU4y2Xs6HQYGl5jXZ9jLMEnirrZHf2udC64xk8Wnc4MqofXn6QmI6d00vrHfaWe8'
  );
  // 1) Get checkout session from API
  try {
    // 1. Get checkout session from the API
    const session = await axios(`/api/v1/booking/checkout-session/${tourId}`);
    // console.log(session);

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    // console.log(err);
    showAlert(
      'error',
      // 'Plaese Confirm your account first to book a tour! check your profile.' // fixed error
      err.response.data.message ? err.response.data.message:err
    );

  }
  // 2) Create checkout form + charge cridit card
};

const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

// type is 'success' or 'error'
const showAlert = (type, msg, time=5000) => {
  hideAlert();
  const markup = `<div class='alert alert--${type}'>${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, time);
};


const loginForm = document.querySelector('.form--login');
if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

const signupForm = document.querySelector('.form--signup');
if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    signup(name,email, password,passwordConfirm);
  });
}
const forgotPassowrdForm = document.querySelector('.form--forgotPassword');
if (forgotPassowrdForm) {
  forgotPassowrdForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
 
    forgotPassowrd(email);
  });
}

const resetPasswordForm = document.querySelector('.form--resetPassword');
if(resetPasswordForm) {
  resetPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;
    // const token = document.querySelector('main').dataset.alert;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('url'); // Assuming the parameter name is 'url'
    // console.log(token);
    if (password !== passwordConfirm)
      showAlert('error', 'Password did not match');
    else resetPassowrd(password, passwordConfirm, token);
  });
}

const sendConfirmation = document.getElementById('sendConfirmation');
if (sendConfirmation) {
  sendConfirmation.onclick = sendConfirmationToEmail;
}

// const confirmAccount = document.getElementById('confirmAccount');
// if (confirmAccount) {
//   const url = confirmAccount.dataset.url;
//   // const host = confirmAccount.dataset('host');
//   // console.log(url);
//   // console.log(host);
//   confirmAccount.onclick = accountConfirmation(url);
// }

const logoutBtn = document.querySelector('.nav__el--logout');
if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}



const userDataForm = document.querySelector('.form-user-data');
if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });
}
const userPassForm = document.querySelector('.form-user-password');
if (userPassForm) {
  userPassForm.addEventListener('submit', async (e) => {
    document.querySelector('.btn--save-password').innerHTML = 'Saving...';
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );
    document.querySelector('.btn--save-password').innerHTML = 'Saved';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

const bookBtn = document.getElementById('book-tour');
if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Porcessing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20000);

