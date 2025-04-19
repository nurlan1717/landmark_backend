const User = require('./../models/userModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require("../utils/appError");

// const filterObj = (obj, ...allowedFields) =>{
//     const newObj = {};
//     Object.keys(obj).filter(el =>{
//         if(allowedFields.includes(el)) newObj[el] = obj[el];
//     })
//     return newObj;
// }

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };
  

exports.getAllUsers = catchAsync(async (req, res, next) => {
    // console.log(req.query)
    const filterCriteria = req.query.role ? { role: req.query.role } : {}
    const features = new APIFeatures(User.find(), req.query)
        .filter()
        .sort()
        .search()
        .limitFields()
        .paginate();
    const allUsers= await features.query

    res.status(200).json({
        status: "success",
        data: allUsers,
    })
});

exports.updateMe = catchAsync(async (req, res, next) => {

    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError("This is not for change password!", 400));
    }

    const filteredBody = filterObj(
        req.body,
        'name',
        'email',
        'fullname',
        'lastname',
        'firstname',
        'photo',
        'phoneNumber',
        'gender',
        'birthDate',
        'city',
        'district'
      );

          const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody , {
        new: true,
        runValidators: true
    })


    res.status(200).json({
        status: "success",
        data: {
            user : updatedUser
        }
    })

})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndDelete(req.user.id, {active : false})
    res.status(204).json({
        status: "success",
        data: null
    })
})

exports.getUserById = catchAsync(async (req, res, next) => {
    const {id} = req.params;
    const oneUser = await User.findById(id)

    if (!oneUser) {
        return next(new AppError('No user with id ' + id, 404 ));
    }

    res.status(200).json(oneUser);
})

// exports.editUserById = catchAsync(async (req, res, next) => {
//     const {id} = req.params;
//     const updatedUser = await User.findByIdAndUpdate(id,
//         req.body,
//         {
//             new: true,
//             runValidators: true
//         })
//
//     if (!updatedUser) {
//         return next(new AppError('No user with id ' + id, 404 ));
//     }
//
//
//     res.status(200).json({
//         "status": "success",
//         "data": updatedUser
//     });
// })

// exports.createProduct = catchAsync(async (req, res, next) => {
//     let newProduct = await Product.create(req.body);
//     res.status(201).json({
//         "status": "success",
//         "data": newProduct
//     });
// })

// exports.deleteProductById = catchAsync(async (req, res, next) => {
//         const {id} = req.params;
//         const deletedProduct = await Car.findByIdAndDelete(id);
//         if (!deletedProduct) {
//             return next(new AppError('No car with id ' + id, 404 ));
//         }
//         res.status(204).json({"status": "success", "data": null})
//     }
// )