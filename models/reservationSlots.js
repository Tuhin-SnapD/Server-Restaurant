const mongoose = require('mongoose');

const reservationSlotSchema = new mongoose.Schema({
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    time: { type: String, required: true },
    seatCapacity: { type: Number, required: true, min: 1 },
    reservedGuests: { type: Number, required: true, min: 0, default: 0 },
    remainingGuests: { type: Number, required: true, min: 0 }
}, { timestamps: true });

reservationSlotSchema.index({ date: 1, time: 1 }, { unique: true });

module.exports = mongoose.model('ReservationSlot', reservationSlotSchema);
