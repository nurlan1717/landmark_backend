const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');


const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch("/updatePassword", authController.updatePassword);


router.patch("/updateMe", authController.protect, userController.updateMe);
router.patch("/deleteMe", authController.protect, userController.deleteMe)

router
    .route('/')
    .get(userController.getAllUsers);

router
    .route('/:id')
    // .get(userController.editUserById)
    // .patch(userController.editUserById)
module.exports = router;