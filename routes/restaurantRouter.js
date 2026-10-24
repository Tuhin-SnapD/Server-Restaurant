const express = require('express');
const ReservationSlot = require('../models/reservationSlots');
const cors = require('./cors');

const router = express.Router();
const TIMES = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'];
const SEAT_CAPACITY = 40;
const TIME_ZONE = process.env.RESTAURANT_TIMEZONE || 'Asia/Kolkata';

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

router.get('/overview', cors.cors, async (req, res, next) => {
    try {
        const now = restaurantClock();
        const savedSlots = await ReservationSlot.find({ date: now.date })
            .select('time reservedGuests remainingGuests')
            .lean();
        const slotsByTime = savedSlots.reduce((result, slot) => {
            result[slot.time] = slot;
            return result;
        }, {});
        const upcomingTimes = TIMES.filter(time => time > now.time).map(time => {
            const saved = slotsByTime[time];
            return {
                time,
                remainingGuests: saved ? saved.remainingGuests : SEAT_CAPACITY
            };
        });
        const availableTimes = upcomingTimes.filter(slot => slot.remainingGuests > 0);
        const serviceStatus = now.time < TIMES[0] ? 'upcoming' : (now.time < TIMES[TIMES.length - 1] ? 'open' : 'closed');

        res.set('Cache-Control', 'no-store');
        return res.status(200).json({
            date: now.date,
            localTime: now.time,
            timeZone: TIME_ZONE,
            serviceStatus,
            seatCapacityPerSeating: SEAT_CAPACITY,
            openSeatings: availableTimes.length,
            remainingSeatCapacity: availableTimes.reduce((total, slot) => total + slot.remainingGuests, 0),
            nextAvailableTime: availableTimes.length ? availableTimes[0].time : null,
            nextAvailableTimes: availableTimes.slice(0, 3)
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
