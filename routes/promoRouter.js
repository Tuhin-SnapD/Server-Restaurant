const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Promotions = require('../models/promotions');
const authenticate = require('../authenticate');
const cors = require('./cors');

const promoRouter = express.Router();

promoRouter.use(bodyParser.json());

promoRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const promotions = await Promotions.find(req.query);
        res.status(200).json(promotions);
    } catch (err) {
        next(err);
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
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
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
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
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