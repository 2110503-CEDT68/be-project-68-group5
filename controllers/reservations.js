//การจองร้านอาหาร
const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

// @desc    Get all reservations
exports.getReservations = async (req, res, next) => {
    let query;

    const populateOptions = [
        { path: 'restaurant', select: 'name address tel opentime closetime' },
        { path: 'user', select: 'name ranking' }
    ];

    if (req.user.role !== 'admin') {
        query = Reservation.find({ user: req.user.id }).populate(populateOptions);
    } else {
        if (req.params.restaurantId) {
            query = Reservation.find({ restaurant: req.params.restaurantId }).populate(populateOptions);
        } else {
            query = Reservation.find().populate(populateOptions);
        }
    }

    try {
        const reservations = await query;
        res.status(200).json({
            success: true,
            count: reservations.length,
            data: reservations
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Cannot find Reservation' });
    }
};

// @desc    Get single reservation
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate([
            { path: 'restaurant', select: 'name address tel opentime closetime' },
            { path: 'user', select: 'name ranking' }
        ]);

        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: `No reservation with the id of ${req.params.id}` 
            });
        }

        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Cannot find Reservation' });
    }
};

// @desc    Add reservation (With Ranking Logic)
exports.addReservation = async (req, res, next) => {
    try {
        req.body.restaurant = req.params.restaurantId;
        const restaurant = await Restaurant.findById(req.body.restaurant);

        if (!restaurant) {
            return res.status(404).json({ 
                success: false, 
                message: `No restaurant with the id of ${req.params.restaurantId}` 
            });
        }

        req.body.user = req.user.id;

        // --- Start Ranking Logic ---
        const user = await User.findById(req.user.id);
        let quotaLimit = 1; // Default: Bronze

        if (user.ranking === 'Silver') quotaLimit = 2;
        else if (user.ranking === 'Gold') quotaLimit = 3;

        const currentReservations = await Reservation.find({ user: req.user.id });

        if (currentReservations.length >= quotaLimit && req.user.role !== 'admin') {
            return res.status(400).json({
                success: false,
                message: `User with rank ${user.ranking} has already made ${currentReservations.length} reservations. (Limit: ${quotaLimit})`
            });
        }
        // --- End Ranking Logic ---

        const reservation = await Reservation.create(req.body);

        res.status(200).json({ success: true, data: reservation });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Cannot create Reservation' });
    }
};

// @desc    Update reservation
exports.updateReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: `No reservation with the id of ${req.params.id}` 
            });
        }

        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ 
                success: false, 
                message: `User ${req.user.id} is not authorized to update this reservation` 
            });
        }

        reservation = await Reservation.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: reservation });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Cannot update Reservation' });
    }
};

// @desc    Delete reservation
exports.deleteReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id);

        if (!reservation) {
            return res.status(404).json({ 
                success: false, 
                message: `No reservation with the id of ${req.params.id}` 
            });
        }

        if (reservation.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ 
                success: false, 
                message: `User ${req.user.id} is not authorized to delete this reservation` 
            });
        }

        await reservation.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: 'Cannot delete Reservation' });
    }
};