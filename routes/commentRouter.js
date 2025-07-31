const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Comments = require('../models/comments');
const authenticate = require('../authenticate');
const cors = require('./cors');
const fs = require('fs');
const path = require('path');

const commentRouter = express.Router();

commentRouter.use(bodyParser.json());

// Helper function to get JSON data as fallback
function getJsonData() {
    try {
        const dbPath = path.join(__dirname, '..', 'db.json');
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON data:', error);
        return { comments: [] };
    }
}

commentRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const comments = await Comments.find(req.query);
        res.status(200).json(comments);
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data
        const jsonData = getJsonData();
        res.status(200).json(jsonData.comments || []);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        req.body.author = req.user._id;
        const comment = await Comments.create(req.body);
        console.log('Comment Created ', comment);
        res.status(200).json(comment);
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /comments' });
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
        const comment = await Comments.findById(req.params.commentId);
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(comment);
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data
        const jsonData = getJsonData();
        const comment = jsonData.comments ? jsonData.comments.find(c => c.id == req.params.commentId) : null;
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(comment);
    }
})
.post(cors.corsWithOptions, (req, res, next) => {
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
        
        if (req.user._id.equals(comment.author)) {
            if (req.body.rating) {
                comment.rating = req.body.rating;
            }
            if (req.body.comment) {
                comment.comment = req.body.comment;
            }
            const savedComment = await comment.save();
            res.status(200).json(savedComment);
        } else {
            const err = new Error('You are not authorized to update this comment!');
            err.status = 403;
            return next(err);
        }
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
        
        if (req.user._id.equals(comment.author) || req.user.admin) {
            await comment.remove();
            res.status(200).json({ message: 'Comment deleted successfully' });
        } else {
            const err = new Error('You are not authorized to delete this comment!');
            err.status = 403;
            return next(err);
        }
    } catch (err) {
        next(err);
    }
});

module.exports = commentRouter;