const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Feedback = require('../models/feedback');
const authenticate = require('../authenticate');
const cors = require('./cors');

const feedbackRouter = express.Router();

feedbackRouter.use(bodyParser.json());

feedbackRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const feedback = await Feedback.find(req.query);
        res.status(200).json(feedback);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, async (req, res, next) => {
    try {
        const feedback = await Feedback.create(req.body);
        console.log('Feedback Created ', feedback);
        res.status(200).json(feedback);
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /feedback' });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Feedback.deleteMany({});
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

feedbackRouter.route('/:feedbackId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const feedback = await Feedback.findById(req.params.feedbackId);
        if (!feedback) {
            const err = new Error('Feedback not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(feedback);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: `POST operation not supported on /feedback/${req.params.feedbackId}` });
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const feedback = await Feedback.findByIdAndUpdate(req.params.feedbackId, {
            $set: req.body
        }, { new: true });
        
        if (!feedback) {
            const err = new Error('Feedback not found');
            err.status = 404;
            return next(err);
        }
        
        res.status(200).json(feedback);
    } catch (err) {
        next(err);
    }
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Feedback.findByIdAndRemove(req.params.feedbackId);
        if (!resp) {
            const err = new Error('Feedback not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

module.exports = feedbackRouter; 