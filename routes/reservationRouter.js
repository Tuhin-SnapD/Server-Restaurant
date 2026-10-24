const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const Reservation = require('../models/reservations');
const ReservationSlot = require('../models/reservationSlots');
const authenticate = require('../authenticate');
const cors = require('./cors');

const reservationRouter = express.Router();
reservationRouter.use(bodyParser.json());

const TIMES = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
const SEAT_CAPACITY = 40;
const MAX_PARTY_SIZE = 12;
const TIME_ZONE = process.env.RESTAURANT_TIMEZONE || 'Asia/Kolkata';

function sendError(res, status, error) {
    return res.status(status).json({ error });
}

function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function restaurantClock() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date()).reduce((result, part) => {
        result[part.type] = part.value;
        return result;
    }, {});
    return {
        date: `${parts.year}-${parts.month}-${parts.day}`,
        time: `${parts.hour}:${parts.minute}`
    };
}

async function getSlots(date, partySize) {
    const savedSlots = await ReservationSlot.find({ date }).lean();
    const clock = restaurantClock();
    const byTime = savedSlots.reduce((result, slot) => {
        result[slot.time] = slot;
        return result;
    }, {});

    return TIMES.map(time => {
        const savedSlot = byTime[time];
        const reservedGuests = savedSlot ? savedSlot.reservedGuests : 0;
        const remainingGuests = savedSlot ? savedSlot.remainingGuests : SEAT_CAPACITY;
        const past = date < clock.date || (date === clock.date && time <= clock.time);
        return { time, reservedGuests, remainingGuests, available: !past && remainingGuests >= partySize, past };
    });
}

async function reserveSeats(date, time, partySize) {
    const existing = await ReservationSlot.findOneAndUpdate(
        { date, time, remainingGuests: { $gte: partySize } },
        { $inc: { reservedGuests: partySize, remainingGuests: -partySize } },
        { new: true }
    );
    if (existing) return existing;

    try {
        return await ReservationSlot.create({
            date, time, seatCapacity: SEAT_CAPACITY,
            reservedGuests: partySize,
            remainingGuests: SEAT_CAPACITY - partySize
        });
    } catch (err) {
        if (err.code !== 11000) throw err;
        return ReservationSlot.findOneAndUpdate(
            { date, time, remainingGuests: { $gte: partySize } },
            { $inc: { reservedGuests: partySize, remainingGuests: -partySize } },
            { new: true }
        );
    }
}

async function releaseSeats(date, time, partySize) {
    return ReservationSlot.findOneAndUpdate(
        { date, time, reservedGuests: { $gte: partySize } },
        { $inc: { reservedGuests: -partySize, remainingGuests: partySize } },
        { new: true }
    );
}

reservationRouter.route('/')
.options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
.post(cors.corsWithOptions, async (req, res, next) => {
    try {
        const guestName = typeof req.body.guestName === 'string' ? req.body.guestName.trim() : '';
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
        const date = req.body.date;
        const time = req.body.time;
        const partySize = Number(req.body.partySize);
        const occasion = req.body.occasion || 'dinner';
        const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

        if (guestName.length < 2 || guestName.length > 80) return sendError(res, 400, 'Enter a name between 2 and 80 characters.');
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/.test(email)) return sendError(res, 400, 'Enter a valid email address.');
        if (phone.length < 7 || phone.length > 24) return sendError(res, 400, 'Enter a phone number between 7 and 24 characters.');
        const clock = restaurantClock();
        if (!validDate(date) || date < clock.date) return sendError(res, 400, 'Choose today or a future date.');
        if (!TIMES.includes(time)) return sendError(res, 400, 'Choose one of the available seating times.');
        if (date === clock.date && time <= clock.time) return sendError(res, 409, 'That seating time has already started. Please choose a later time.');
        if (!Number.isInteger(partySize) || partySize < 1 || partySize > MAX_PARTY_SIZE) return sendError(res, 400, `Party size must be between 1 and ${MAX_PARTY_SIZE}.`);
        if (!['dinner', 'birthday', 'anniversary', 'business', 'other'].includes(occasion)) return sendError(res, 400, 'Choose a valid occasion.');
        if (note.length > 500) return sendError(res, 400, 'Notes must be 500 characters or fewer.');

        const allocated = await reserveSeats(date, time, partySize);
        if (!allocated) return sendError(res, 409, 'That seating time no longer has enough room. Please choose another time.');

        let reservation;
        try {
            reservation = await Reservation.create({
                guestName, email, phone, date, time, partySize, occasion, note,
                confirmationCode: crypto.randomBytes(4).toString('hex').toUpperCase()
            });
        } catch (err) {
            await releaseSeats(date, time, partySize);
            throw err;
        }

        return res.status(201).json({
            reservation,
            message: 'Your reservation request has been received. The restaurant will confirm it shortly.'
        });
    } catch (err) {
        if (err.code === 11000) return sendError(res, 409, 'Please retry your reservation request.');
        next(err);
    }
})
.get(cors.cors, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.date) {
            if (!validDate(req.query.date)) return sendError(res, 400, 'Date must use YYYY-MM-DD.');
            filter.date = req.query.date;
        }
        if (req.query.status) {
            if (!['requested', 'confirmed', 'cancelled', 'completed'].includes(req.query.status)) return sendError(res, 400, 'Invalid reservation status.');
            filter.status = req.query.status;
        }
        const reservations = await Reservation.find(filter).sort({ date: 1, time: 1, createdAt: -1 }).lean();
        return res.status(200).json(reservations);
    } catch (err) {
        next(err);
    }
});

reservationRouter.get('/availability', cors.cors, async (req, res, next) => {
    try {
        const date = req.query.date;
        const partySize = Number(req.query.partySize || 2);
        const clock = restaurantClock();
        if (!validDate(date) || date < clock.date) return sendError(res, 400, 'Choose today or a future date.');
        if (!Number.isInteger(partySize) || partySize < 1 || partySize > MAX_PARTY_SIZE) return sendError(res, 400, `Party size must be between 1 and ${MAX_PARTY_SIZE}.`);

        const slots = await getSlots(date, partySize);
        return res.status(200).json({ date, partySize, seatCapacity: SEAT_CAPACITY, timeZone: TIME_ZONE, slots });
    } catch (err) {
        next(err);
    }
});

reservationRouter.put('/:reservationId/status', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const allowed = ['requested', 'confirmed', 'cancelled', 'completed'];
        if (!allowed.includes(req.body.status)) return sendError(res, 400, 'Choose a valid reservation status.');
        const reservation = await Reservation.findById(req.params.reservationId);
        if (!reservation) return sendError(res, 404, 'Reservation not found.');
        const wasCancelled = reservation.status === 'cancelled';
        const willCancel = req.body.status === 'cancelled';
        if (wasCancelled && !willCancel) {
            const allocated = await reserveSeats(reservation.date, reservation.time, reservation.partySize);
            if (!allocated) return sendError(res, 409, 'There is no longer enough capacity to reactivate this reservation.');
        }
        reservation.status = req.body.status;
        await reservation.save();
        if (!wasCancelled && willCancel) await releaseSeats(reservation.date, reservation.time, reservation.partySize);
        return res.status(200).json(reservation);
    } catch (err) {
        next(err);
    }
});

module.exports = reservationRouter;
