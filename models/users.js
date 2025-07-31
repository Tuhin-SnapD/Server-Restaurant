const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
    firstname: {
        type: String,
        default: '',
        trim: true
    },
    lastname: {
        type: String,
        default: '',
        trim: true
    },
    facebookId: {
        type: String,
        unique: true,
        sparse: true
    },
    admin: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);