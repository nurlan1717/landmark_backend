const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
        firstname: {
            type: String, required: [true, "First name is required!"]
        },
        lastname: {
            type: String, required: [true, "Last name is required!"]
        },
        email: {
            type: String,
            required: [true, "Email is required!"],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, "Please enter a valid email address!"]
        },
        photo: String, password: {
            type: String, required: [true, "Password is required!"], minlength: 8, select: false,
        },
        passwordConfirm: {
            type: String, required: [true, "Password confirm is required!"], validate: {
                validator: function (confPass) {
                    return confPass === this.password;
                }, message: "Password and confirm is not match!"
            }
        },
        active: {
            type: Boolean, default: true,
        },
        role: {
            type: String, default: 'user', enum: ['user', 'seller', 'administrator'],
            select: false,
        },
        passwordChangedAt: Date, passwordResetToken: String, passwordResetExpires: Date,
    }, {
        toJSON: {virtuals: true},
        toObject: {virtuals: true},
        id: false
    }
)

userSchema.virtual('products', {
    ref: 'Product',
    foreignField: 'seller',
    localField: '_id'
})

userSchema.pre('save', async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;
    next();

})

userSchema.pre('save', function (next) {
    if (!this.isModified("password") || this.isNew) return next();
    this.passwordChangedAt = Date.now() - 1000;
    next()
})

userSchema.pre(/^find/, function (next) {
    // this points to the current query
    this.find({active: {$ne: false}});
    next();
});


userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }

    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString("hex");

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest("hex");

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

const User = mongoose.model('User', userSchema);

module.exports = User;