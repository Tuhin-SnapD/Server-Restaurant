const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
    guestName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please enter a valid email']
    },
    phone: { type: String, required: true, trim: true, minlength: 7, maxlength: 24 },
    date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD'] },
    time: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1, max: 12 },
    occasion: {
        type: String,
        enum: ['dinner', 'birthday', 'anniversary', 'business', 'other'],
        default: 'dinner'
    },
    note: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
        type: String,
        enum: ['requested', 'confirmed', 'cancelled', 'completed'],
        default: 'requested'
    },
    confirmationCode: { type: String, required: true, unique: true, uppercase: true }
}, { timestamps: true });

reservationSchema.index({ date: 1, time: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
