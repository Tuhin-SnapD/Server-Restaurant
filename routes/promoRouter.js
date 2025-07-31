const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Promotions = require('../models/promotions');
const authenticate = require('../authenticate');
const cors = require('./cors');
const fs = require('fs');
const path = require('path');

const promoRouter = express.Router();

promoRouter.use(bodyParser.json());

// Helper function to get JSON data as fallback
function getJsonData() {
    try {
        const dbPath = path.join(__dirname, '..', 'db.json');
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON data:', error);
        return { promotions: [] };
    }
}

promoRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const promotions = await Promotions.find(req.query);
        res.status(200).json(promotions);
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data
        const jsonData = getJsonData();
        res.status(200).json(jsonData.promotions || []);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const promotion = await Promotions.create(req.body);
        console.log('Promotion Created ', promotion);
        res.status(200).json(promotion);
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /promotions' });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Promotions.deleteMany({});
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

promoRouter.route('/:promoId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const promotion = await Promotions.findById(req.params.promoId);
        if (!promotion) {
            const err = new Error('Promotion not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(promotion);
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data
        const jsonData = getJsonData();
        const promotion = jsonData.promotions ? jsonData.promotions.find(p => p.id == req.params.promoId) : null;
        if (!promotion) {
            const err = new Error('Promotion not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(promotion);
    }
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: `POST operation not supported on /promotions/${req.params.promoId}` });
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const promotion = await Promotions.findByIdAndUpdate(req.params.promoId, {
            $set: req.body
        }, { new: true });
        
        if (!promotion) {
            const err = new Error('Promotion not found');
            err.status = 404;
            return next(err);
        }
        
        res.status(200).json(promotion);
    } catch (err) {
        next(err);
    }
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Promotions.findByIdAndRemove(req.params.promoId);
        if (!resp) {
            const err = new Error('Promotion not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

module.exports = promoRouter;