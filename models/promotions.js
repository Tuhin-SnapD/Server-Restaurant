const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const promoSchema = new Schema({
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
    label: {
        type: String,
        default: "",
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
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

const Promotions = mongoose.model('Promotion', promoSchema);

module.exports = Promotions;