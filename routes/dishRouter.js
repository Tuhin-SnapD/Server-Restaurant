const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Dishes = require('../models/dishes');
const authenticate = require('../authenticate');
const cors = require('./cors');

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

dishRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const dishes = await Dishes.find(req.query).lean();
        res.status(200).json(dishes);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const dish = await Dishes.create(req.body);
        res.status(201).json(dish);
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /dishes' });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Dishes.deleteMany({});
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

dishRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const dish = await Dishes.findById(req.params.dishId).lean();
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(dish);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: `POST operation not supported on /dishes/${req.params.dishId}` });
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const dish = await Dishes.findByIdAndUpdate(req.params.dishId, {
            $set: req.body
        }, { new: true, runValidators: true });
        
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        
        res.status(200).json(dish);
    } catch (err) {
        next(err);
    }
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const resp = await Dishes.findByIdAndDelete(req.params.dishId);
        if (!resp) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

// Handle comments for a specific dish
dishRouter.route('/:dishId/comments')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const dish = await Dishes.findById(req.params.dishId).select('comments').lean();
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(dish.comments || []);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUserOptional, async (req, res, next) => {
    try {
        const rating = Number(req.body.rating);
        const commentText = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';
        const author = (req.user && req.user.username) ||
            (typeof req.body.author === 'string' && req.body.author.trim()) ||
            'Guest';

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            const err = new Error('Rating must be a whole number between 1 and 5');
            err.status = 400;
            return next(err);
        }
        if (!commentText) {
            const err = new Error('Comment is required');
            err.status = 400;
            return next(err);
        }

        const dish = await Dishes.findById(req.params.dishId);
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }

        const newComment = dish.comments.create({
            rating: rating,
            comment: commentText,
            author: author.slice(0, 50)
        });
        dish.comments.push(newComment);
        await dish.save();

        // Return the created comment (with its dish id) so clients can add it
        // to their local state without refetching the whole dish.
        res.status(201).json({ ...newComment.toObject(), dishId: dish._id });
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: `PUT operation not supported on /dishes/${req.params.dishId}/comments` });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const dish = await Dishes.findById(req.params.dishId);
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        
        dish.comments = [];
        const savedDish = await dish.save();
        res.status(200).json(savedDish);
    } catch (err) {
        next(err);
    }
});

// Handle specific comment
dishRouter.route('/:dishId/comments/:commentId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, async (req, res, next) => {
    try {
        const dish = await Dishes.findById(req.params.dishId);
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        
        const comment = dish.comments.id(req.params.commentId);
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
.post(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: `POST operation not supported on /dishes/${req.params.dishId}/comments/${req.params.commentId}` });
})
.put(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const dish = await Dishes.findById(req.params.dishId);
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        
        const comment = dish.comments.id(req.params.commentId);
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
            const savedDish = await dish.save();
            res.status(200).json(savedDish);
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
        const dish = await Dishes.findById(req.params.dishId);
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        
        const comment = dish.comments.id(req.params.commentId);
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            return next(err);
        }
        
        if (req.user._id.equals(comment.author) || req.user.admin) {
            comment.remove();
            const savedDish = await dish.save();
            res.status(200).json(savedDish);
        } else {
            const err = new Error('You are not authorized to delete this comment!');
            err.status = 403;
            return next(err);
        }
    } catch (err) {
        next(err);
    }
});

module.exports = dishRouter;