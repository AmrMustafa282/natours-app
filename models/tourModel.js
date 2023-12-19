const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required!'],
      unique: true,
      trim: true, // remove white spaces in the begining and the end
      maxlength: [40, 'A tour name must have less or equal than 40 chars'],
      minlength: [10, 'A tour name must have more or equal than 100 chars'],
      // validate: [validator.isAlpha,'name must only contains letters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      max: [5, 'Rating must be below or equal 5.0'],
      min: [1, 'Rating must be above or equal 1.0'],
      // setter function that will run each time there is a new value for this field
      set: val => Math.round(val *10) /10 
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Price is required!'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this keyword here only points to current doc on .create() only
          const ref = this.price ? this.price : 1000;
          return val < ref;
        },
        message: 'price discount ({VALUE}) must be less that the price',
      },
    },
    summary: {
      type: String,
      trim: true, // remove white spaces in the begining and the end
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // Tour Guieds [EMBEDDING]
    //  guides:Array

    // Tour Guieds [CHILD REFERENCING]
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
  },
  {
    timestamps: true,
  },
);

tourSchema.set('toJSON', { virtuals: true });
tourSchema.set('toObject', { virtuals: true });

// tourSchema.index({price:1})  // Single fiels index  // [1 =>  asc , -1 => desc]
tourSchema.index({ price: 1, ratingsAverage: -1 });     // Combined index
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation :'2dsphere'}); // in order to run geoSpatial querys
 
// Virtual Field
tourSchema.virtual('durationWeeks').get(function () {
  // using regural function to use this keyword
  return this.duration / 7;
});

// Virtual Populating [chile Ref]
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});


// 1) Document Middleware [  runs only with  .save() and .create() ]
tourSchema.pre('save', function (next) {
  // console.log(this) // this the document that is being processed
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   // console.log('------------------');
//   // console.log(this);
//   // console.log('------------------');
//   next();
// });

tourSchema.post('save', function (doc, next) {
  // console.log(doc); // doc the document that is just saved
  doc.slug = slugify(doc.name, { upper: true });
  next();
});

// 2) Query Middelware [  runs with query => any () starts with find ]
tourSchema.pre(/^find/, function (next) {
  // console.log(this) // this point to the current query
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function (docs, next) { // docs can be accessed in post query middleware only
//   // console.log('-----------------------------------------------');
//   // console.log(docs) // docs point to an Array that contains all the docs
//   // console.log('-----------------------------------------------');
//   // console.log(this); // this point to the current query
//   // console.log('-----------------------------------------------');
//   // this.find({ secretTour: { $ne: true } });
//   // console.log(Date.now() - this.start);
//   next();
// });

// filling refreced data [User]
tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select:'-__v -passwordChangedAt'
  })

  next();
})


// 3) Aggregation Middelware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // add a stage before aggregation to unshow the secretTours

//   // console.log(this) // points to aggregation object
//   console.log(this.pipeline()); // points to pipline array objects
//   next();
// });

// to store guides date got from User by its id && must build this logic for update also but we wont use this embadding for its drawbacks
// tourSchema.pre('save',async function (next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id));
//   this.guides = Promise.all(guidesPromises);
//   next();
// })

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
