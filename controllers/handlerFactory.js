const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures= require('./../utils/apiFeatures')



exports.getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourID) filter = { tour: req.params.tourId };
    let query = Model.find(filter);
    if (popOptions) query = query.populate(popOptions);
    const features = new APIFeatures(query, req.query) // Model insted of Model.find()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query; //.explain()

    // Send response
    res.status(200).json({
      status: 'success',
      results: doc.length,
      data: {
        data: doc,
      },
    });
    // try {
    //   // console.log(req.query);
    //   // Build a query
    //   // 1-A) Filtering

    //   // const queryObj = { ...req.query };
    //   // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //   // excludedFields.forEach((el) => delete queryObj[el]);

    //   // // 1-B) Advanced Filtering

    //   // const queryStr = JSON.stringify(queryObj).replace(
    //   //   /\b(gte|gt|lte|lt)\b/g,
    //   //   (match) => `$${match}`
    //   // );
    //   // // console.log(JSON.parse(queryStr));

    //   // let query = Tour.find(JSON.parse(queryStr));

    //   // 2) Sroting
    //   // if (req.query.sort) {
    //   //   const sortBy = req.query.sort.split(',').join(' ');
    //   //   console.log(sortBy)
    //   //   query = query.sort(sortBy);
    //   //   // sort('price ratingsAverage')
    //   // } else {
    //   //   query = query.sort('-createdAt')
    //   // }

    //   // 3) Field limiting

    //   // if (req.query.fields) {
    //   //   const fields = req.query.fields.split(',').join(' ');
    //   //   query = query.select(fields)
    //   // } else {
    //   //   query = query.select('-__v')
    //   // }

    //   // 4) Pagination
    //   // const page = +req.query.page || 1;
    //   // const limit = +req.query.limit || 100;
    //   // const skip = (page - 1) * limit;
    //   // // page=2&limit=10, 1-10, page 1 , 11-20, page2
    //   // query = query.skip(skip).limit(limit);

    //   // if (req.query.page) {
    //   //   const numTours = await Tour.countDocuments();
    //   //   if(skip >= numTours) throw new Error("This page does not exist")
    //   // }
    //   // { difficulty: 'easy', duration:{&gte:5}}

    //   // mongoose special methods for filter
    //   // const query =  Tour.find()
    //   //   .where('duration')
    //   //   .equals(5)
    //   //   .where('difficulty')
    //   //   .equals('easy');

    //   // Execute a query

    //   const features = new APIFeatures(Tour, req.query)
    //     .filter()
    //     .sort()
    //     .limitFields()
    //     .paginate();

    //   const tours = await features.query;

    //   // Send response
    //   res.status(200).json({
    //     status: 'success',
    //     results: tours.length,
    //     data: {
    //       tours,
    //     },
    //   });
    // } catch (err) {
    //   res.status(400).json({
    //     status: 'fail',
    //     message: 'No such data',
    //   });
    // }
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    // const doc = await query.find({ _id: '5c88fa8cf4afda39709c2955' });    Query Chaning and the last one is the result will be 
    
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data:doc,
      },
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document Found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // the one which will return is the new updated one
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No Document Found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data:doc,
      },
    });
  });



