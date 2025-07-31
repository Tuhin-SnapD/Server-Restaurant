const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Favorites = require('../models/favorites');
const authenticate = require('../authenticate');
const cors = require('./cors');
const fs = require('fs');
const path = require('path');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

// Helper function to get JSON data as fallback
function getJsonData() {
    try {
        const dbPath = path.join(__dirname, '..', 'db.json');
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading JSON data:', error);
        return { favorites: [] };
    }
}

favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favorites = await Favorites.find({ user: req.user._id }).populate('user').populate('dishes');
        res.status(200).json(favorites);
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data - return empty array for favorites since they're user-specific
        res.status(200).json([]);
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favorites = await Favorites.findOne({ user: req.user._id });
        if (!favorites) {
            const newFavorites = await Favorites.create({ user: req.user._id, dishes: req.body });
            res.status(200).json(newFavorites);
        } else {
            req.body.forEach(dish => {
                if (favorites.dishes.indexOf(dish._id) === -1) {
                    favorites.dishes.push(dish._id);
                }
            });
            const savedFavorites = await favorites.save();
            res.status(200).json(savedFavorites);
        }
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: 'PUT operation not supported on /favorites' });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const resp = await Favorites.findOneAndRemove({ user: req.user._id });
        res.status(200).json(resp);
    } catch (err) {
        next(err);
    }
});

favoriteRouter.route('/:dishId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favorites = await Favorites.findOne({ user: req.user._id });
        if (!favorites) {
            res.status(200).json({ exists: false, favorites: null });
        } else {
            const exists = favorites.dishes.indexOf(req.params.dishId) !== -1;
            res.status(200).json({ exists: exists, favorites: favorites });
        }
    } catch (err) {
        console.log('MongoDB connection failed, using JSON fallback');
        // Fallback to JSON data - return not found for favorites since they're user-specific
        res.status(200).json({ exists: false, favorites: null });
    }
})
.post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favorites = await Favorites.findOne({ user: req.user._id });
        if (!favorites) {
            const newFavorites = await Favorites.create({ user: req.user._id, dishes: [req.params.dishId] });
            res.status(200).json(newFavorites);
        } else {
            if (favorites.dishes.indexOf(req.params.dishId) === -1) {
                favorites.dishes.push(req.params.dishId);
                const savedFavorites = await favorites.save();
                res.status(200).json(savedFavorites);
            } else {
                res.status(200).json(favorites);
            }
        }
    } catch (err) {
        next(err);
    }
})
.put(cors.corsWithOptions, (req, res, next) => {
    res.status(403).json({ message: `PUT operation not supported on /favorites/${req.params.dishId}` });
})
.delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
    try {
        const favorites = await Favorites.findOne({ user: req.user._id });
        if (!favorites) {
            res.status(200).json(favorites);
        } else {
            const index = favorites.dishes.indexOf(req.params.dishId);
            if (index !== -1) {
                favorites.dishes.splice(index, 1);
                const savedFavorites = await favorites.save();
                res.status(200).json(savedFavorites);
            } else {
                res.status(200).json(favorites);
            }
        }
    } catch (err) {
        next(err);
    }
});

module.exports = favoriteRouter;