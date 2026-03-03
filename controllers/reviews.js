//รีวิว
const Restaurant = require('../models/Restaurant')

const Review = require('../models/Review');


exports.getReviews = async (req, res, next) => {
    let query;

    if(req.params.restaurantId) {
        console.log(req.params.restaurantId);

        query = Review.find({
            restaurant: req.params.restaurantId
        }).populate({
            path: 'restaurant',
            select: 'name'
        });
    }else{
        query = Review.find().populate({
            path: 'restaurant',
            select: 'name'
        });
    }
    try{
        const reviews = await query;
        res.status(200).json({
            success: true,
            count: reviews.length,
            data: reviews

        });
    }catch(err){
        console.log(err);
        return res.status(500).json({
            success: false,
            message: 'Cannot find Review'
        });
    }
};

exports.getReview = async (req, res, next) => {
    try{
        const review = await Review.findById(req.params.id).populate({
            path: 'restaurant',
            select: 'name'
        });


        if(!review){
            return res.status(404).json({success:false, message: `No review with the id of ${req.params.id}`});
        }

        res.status(200).json({
            success: true,
            data: review
        });
    }catch (error){
        console.log(error);
        return res.status(500).json({success: false, message: 'Cannot find Review'});
    }
};

exports.createReview = async (req, res, next) => {
    try {
        req.body.restaurant = req.params.restaurantId;

        const restaurant = await Restaurant.findById(req.params.restaurantId);

        if(!restaurant){
            return res.status(404).json({success: false, message: `No restaurant with the id of ${req.params.restaurantID}`});
        }
        
        req.body.user = req.user.id;
        
        const existingReview = await Review.find({ user: req.body.user, restaurant: req.params.restaurantId });

        if (existingReview.length >= 1 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} has already made a review for this restaurant` });
        }

        const review = await Review.create(req.body);

        res.status(200).json({
            success:true,
            data: review
        });
    }catch(err){
        console.log(err);
        if(req.body.rating < 0 || req.body.rating > 5){
            return res.status(400).json({ success: false, message: `rating value can only between 0-5`});
        }
        return res.status(500).json({success: false, message: 'Cannot create Review'});
    }
};

exports.updateReview = async (req, res, next) => {
    try{
        let review = await Review.findById(req.params.id);

        if(!review){
            return res.status(404).json({
                success: false, message: `No review with the id of ${req.params.id}`
            });
        }

        if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to update this review`});
        }

        review = await Review.findByIdAndUpdate(req.params.id, req.body,{
            new:true,
            runValidators: true
        });
        res.status(200).json({
            success: true,
            data: review
        });
    }catch (error){
        console.log(error);
        return res.status(500).json({success: false, message: 'Cannot update Review'});
    }
};

exports.deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: `No review with the id of ${req.params.id}`});
        }

        if(review.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to delete this review`});
        }

        await review.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Cannot delete Review' });
    }
};
