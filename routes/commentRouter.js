const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const cors = require('./cors');
const Comments = require('../models/comments');

const commentRouter = express.Router();

commentRouter.use(bodyParser.json());

commentRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const comments = await Comments.find(req.query).populate('author');
        res.status(200).json(comments);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        if (!req.body) {
            const err = new Error('Comment not found in request body');
            err.status = 400;
            return next(err);
        }
        
        req.body.author = req.user._id;
        const comment = await Comments.create(req.body);
        const populatedComment = await Comments.findById(comment._id).populate('author');
        
        res.status(200).json(populatedComment);
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /comments/' });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Comments.deleteMany({});
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

commentRouter.route('/:commentId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const comment = await Comments.findById(req.params.commentId).populate('author');
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(comment);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).json({ message: `POST operation not supported on /comments/${req.params.commentId}` });
})
.put(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const comment = await Comments.findById(req.params.commentId);
        
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        
        if (!comment.author.equals(req.user._id)) {
            const err = new Error('You are not authorized to update this comment!');
            err.status = 403;
            return next(err);
        }
        
        req.body.author = req.user._id;
        const updatedComment = await Comments.findByIdAndUpdate(req.params.commentId, {
            $set: req.body
        }, { new: true });
        
        const populatedComment = await Comments.findById(updatedComment._id).populate('author');
        res.status(200).json(populatedComment);
    } catch (err) {
        next(err);
    }
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const comment = await Comments.findById(req.params.commentId);
        
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        
        if (!comment.author.equals(req.user._id)) {
            const err = new Error('You are not authorized to delete this comment!');
            err.status = 403;
            return next(err);
        }
        
        const resp = await Comments.findByIdAndRemove(req.params.commentId);
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

module.exports = commentRouter;