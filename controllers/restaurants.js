// ร้านขายอาหาร
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');

// @desc    Get all restaurants (With Filters & Pagination)
exports.getRestaurants = async (req, res, next) => {
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    let query = Restaurant.find(JSON.parse(queryStr)).populate('reservations');

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    // Pagination Logic
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    try {
        const total = await Restaurant.countDocuments();
        query = query.skip(startIndex).limit(limit);
        
        const rawRestaurants = await query;
        const restaurants = [];

        // Calculate Average Rating for each restaurant
        for (let resItem of rawRestaurants) {
            const stats = await Review.aggregate([
                { $match: { restaurant: resItem._id } },
                { $group: { _id: null, averageRating: { $avg: "$rating" } } }
            ]);

            restaurants.push({
                ...resItem._doc,
                reservations: resItem.reservations,
                averageRating: stats.length > 0 ? stats[0].averageRating.toFixed(1) : 'No Review'
            });
        }

        const pagination = {};
        if (endIndex < total) pagination.next = { page: page + 1, limit };
        if (startIndex > 0) pagination.prev = { page: page - 1, limit };

        res.status(200).json({
            success: true,
            count: restaurants.length,
            pagination,
            data: restaurants
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

// @desc    Get single restaurant
exports.getRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(400).json({ success: false });
        }

        const stats = await Review.aggregate([
            { $match: { restaurant: restaurant._id } },
            { $group: { _id: null, averageRating: { $avg: "$rating" } } }
        ]);

        res.status(200).json({
            success: true,
            data: restaurant,
            averageRating: stats.length > 0 ? stats[0].averageRating.toFixed(1) : 'No Review'
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

// @desc    Create new restaurant
exports.createRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.create(req.body);
        res.status(201).json({ success: true, data: restaurant });
    } catch (err) {
        res.status(400).json({ 
            success: false, 
            msg: "Please provide an alternative name, this one is already taken." 
        });
    }
};

// @desc    Update restaurant
exports.updateRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!restaurant) return res.status(400).json({ success: false });

        res.status(200).json({ success: true, data: restaurant });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};

// @desc    Delete restaurant
exports.deleteRestaurant = async (req, res, next) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) return res.status(400).json({ success: false });

        await restaurant.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};