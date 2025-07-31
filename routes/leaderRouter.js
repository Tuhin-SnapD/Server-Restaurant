const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Leaders = require('../models/leaders');
const authenticate = require('../authenticate');
const cors = require('./cors');
const fs = require('fs');
const path = require('path');

const leaderRouter = express.Router();

leaderRouter.use(bodyParser.json());

// Helper function to get JSON data as fallback
function getJsonData() {
    try {
        const dbPath = path.join(__dirname, '..', 'db.json');
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON data:', error);
        return { leaders: [] };
    }
}

leaderRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const leaders = await Leaders.find(req.query);
        res.status(200).json(leaders);
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data
        const jsonData = getJsonData();
        res.status(200).json(jsonData.leaders || []);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const leader = await Leaders.create(req.body);
        console.log('Leader Created ', leader);
        res.status(200).json(leader);
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /leaders' });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Leaders.deleteMany({});
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

leaderRouter.route('/:leaderId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const leader = await Leaders.findById(req.params.leaderId);
        if (!leader) {
            const err = new Error('Leader not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(leader);
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data
        const jsonData = getJsonData();
        const leader = jsonData.leaders ? jsonData.leaders.find(l => l.id == req.params.leaderId) : null;
        if (!leader) {
            const err = new Error('Leader not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(leader);
    }
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: `POST operation not supported on /leaders/${req.params.leaderId}` });
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const leader = await Leaders.findByIdAndUpdate(req.params.leaderId, {
            $set: req.body
        }, { new: true });
        
        if (!leader) {
            const err = new Error('Leader not found');
            err.status = 404;
            return next(err);
        }
        
        res.status(200).json(leader);
    } catch (err) {
        next(err);
    }
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Leaders.findByIdAndRemove(req.params.leaderId);
        if (!resp) {
            const err = new Error('Leader not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

module.exports = leaderRouter;