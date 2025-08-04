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
        const dishes = await Dishes.find(req.query);
        res.status(200).json(dishes);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, async (req, res, next) => {
    try {
        const dish = await Dishes.create(req.body);
        console.log('Dish Created ', dish);
        res.status(200).json(dish);
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
        const dish = await Dishes.findById(req.params.dishId);
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
        }, { new: true });
        
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
        const resp = await Dishes.findByIdAndRemove(req.params.dishId);
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
        const dish = await Dishes.findById(req.params.dishId);
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json(dish.comments);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const dish = await Dishes.findById(req.params.dishId);
        if (!dish) {
            const err = new Error('Dish not found');
            err.status = 404;
            return next(err);
        }
        
        req.body.author = req.user._id;
        dish.comments.push(req.body);
        const savedDish = await dish.save();
        res.status(200).json(savedDish);
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
        
        for (let i = (dish.comments.length - 1); i >= 0; i--) {
            dish.comments.id(dish.comments[i]._id).remove();
        }
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