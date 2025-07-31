const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const leaderSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true,
        trim: true
    },
    abbr: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Leaders = mongoose.model('Leader', leaderSchema);

module.exports = Leaders;