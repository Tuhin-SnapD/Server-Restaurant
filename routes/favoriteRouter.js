const express = require('express');
const bodyParser = require('body-parser');
const Favorites = require('../models/favorite');
const authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

const normalizeDishIds = (body) => {
    const items = Array.isArray(body) ? body : [body];
    return items
        .map((item) => (item && (item._id || item.id)) || item)
        .filter(Boolean)
        .map((id) => id.toString());
};

const hasDish = (favorites, dishId) =>
    favorites.dishes.some((id) => id.toString() === dishId);

favoriteRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorites.find({ user: req.user._id })
                .populate('user', 'username firstname lastname admin')
                .populate('dishes')
                .lean();
            res.status(200).json(favorites);
        } catch (err) {
            next(err);
        }
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const dishIds = normalizeDishIds(req.body);
            if (dishIds.length === 0) {
                const err = new Error('At least one dish id is required');
                err.status = 400;
                return next(err);
            }

            const favorites = await Favorites.findOne({ user: req.user._id });
            if (!favorites) {
                const newFavorites = await Favorites.create({
                    user: req.user._id,
                    dishes: dishIds
                });
                return res.status(201).json(newFavorites);
            }

            dishIds.forEach((dishId) => {
                if (!hasDish(favorites, dishId)) {
                    favorites.dishes.push(dishId);
                }
            });
            const savedFavorites = await favorites.save();
            res.status(200).json(savedFavorites);
        } catch (err) {
            next(err);
        }
    })
    .put(cors.corsWithOptions, (req, res) => {
        res.status(403).json({ message: 'PUT operation not supported on /favorites' });
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const resp = await Favorites.findOneAndDelete({ user: req.user._id });
            res.status(200).json(resp);
        } catch (err) {
            next(err);
        }
    });

favoriteRouter.route('/:dishId')
    .options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
    .get(cors.cors, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorites.findOne({ user: req.user._id }).lean();
            const exists = favorites ? hasDish(favorites, req.params.dishId) : false;
            res.status(200).json({ exists: exists, favorites: favorites || null });
        } catch (err) {
            next(err);
        }
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorites.findOne({ user: req.user._id });
            if (!favorites) {
                const newFavorites = await Favorites.create({
                    user: req.user._id,
                    dishes: [req.params.dishId]
                });
                return res.status(201).json(newFavorites);
            }

            if (!hasDish(favorites, req.params.dishId)) {
                favorites.dishes.push(req.params.dishId);
                const savedFavorites = await favorites.save();
                return res.status(200).json(savedFavorites);
            }
            res.status(200).json(favorites);
        } catch (err) {
            next(err);
        }
    })
    .put(cors.corsWithOptions, (req, res) => {
        res.status(403).json({ message: `PUT operation not supported on /favorites/${req.params.dishId}` });
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, async (req, res, next) => {
        try {
            const favorites = await Favorites.findOne({ user: req.user._id });
            if (!favorites) {
                return res.status(200).json(null);
            }

            const index = favorites.dishes.findIndex(
                (id) => id.toString() === req.params.dishId
            );
            if (index !== -1) {
                favorites.dishes.splice(index, 1);
                const savedFavorites = await favorites.save();
                return res.status(200).json(savedFavorites);
            }
            res.status(200).json(favorites);
        } catch (err) {
            next(err);
        }
    });

module.exports = favoriteRouter;
