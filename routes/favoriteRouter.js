const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Favourites = require('../models/favorite');
const Dishes = require('../models/dishes');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favourites = await Favourites.findOne({user: req.user._id})
            .populate('user')
            .populate('dishes');
        res.status(200).json(favourites);
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        let favorite = await Favourites.findOne({user: req.user._id});
        
        if (favorite) {
            for (let i = 0; i < req.body.length; i++) {
                if (favorite.dishes.indexOf(req.body[i]._id) === -1) {
                    favorite.dishes.push(req.body[i]._id);
                }
            }
            favorite = await favorite.save();
            console.log('Favorite Updated ', favorite);
            res.status(200).json(favorite);
        } else {
            favorite = await Favourites.create({"user": req.user._id, "dishes": req.body});
            console.log('Favorite Created ', favorite);
            res.status(200).json(favorite);
        }
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /favourites' });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const resp = await Favourites.findOneAndRemove({"user": req.user._id});
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favourites = await Favourites.findOne({user: req.user._id});
        
        if (!favourites) {
            return res.status(200).json({"exists": false, "favourites": favourites});
        }
        
        const exists = favourites.dishes.indexOf(req.params.dishId) >= 0;
        res.status(200).json({"exists": exists, "favourites": favourites});
    } catch (err) {
        next(err);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        let favorite = await Favourites.findOne({user: req.user._id});
        
        if (favorite) {
            if (favorite.dishes.indexOf(req.params.dishId) === -1) {
                favorite.dishes.push(req.params.dishId);
                favorite = await favorite.save();
                console.log('Favorite Updated ', favorite);
                res.status(200).json(favorite);
            } else {
                res.status(200).json(favorite);
            }
        } else {
            favorite = await Favourites.create({"user": req.user._id, "dishes": [req.params.dishId]});
            console.log('Favorite Created ', favorite);
            res.status(200).json(favorite);
        }
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.status(403).json({ message: `PUT operation not supported on /favourites/${req.params.dishId}` });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favorite = await Favourites.findOne({user: req.user._id});
        
        if (!favorite) {
            const err = new Error('Favourites not found');
            err.status = 404;
            return next(err);
        }
        
        const index = favorite.dishes.indexOf(req.params.dishId);
        if (index >= 0) {
            favorite.dishes.splice(index, 1);
            await favorite.save();
            
            const updatedFavorite = await Favourites.findById(favorite._id)
                .populate('user')
                .populate('dishes');
            
            console.log('Favorite Dish Deleted!', updatedFavorite);
            res.status(200).json(updatedFavorite);
        } else {
            const err = new Error(`Dish ${req.params.dishId} not found in favorites`);
            err.status = 404;
            return next(err);
        }
    } catch (err) {
        next(err);
    }
});

module.exports = favoriteRouter;