const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');
const sellerController = require('./../controllers/sellerController')


const router = express.Router();

router.post('/createSeller',authController.protect, sellerController.createSeller);
router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.patch('/update-password', authController.protect, authController.updatePassword);

router.patch("/updateMe", authController.protect, userController.updateMe);
router.patch("/deleteMe", authController.protect, userController.deleteMe);

router
    .route('/')
    .get(userController.getAllUsers)
// .post(userController.createUser);

router
    .route('/:id')
    .get(userController.getUserById)
// .patch(userController.updateUser)
// .delete(userController.deleteUser);

module.exports = router;