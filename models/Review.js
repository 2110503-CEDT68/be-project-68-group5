// ฟีล เเต่ละ table ของ รีวิว
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: [0, "Value must in between 0 - 5"],
        max: [5, "Value must in between 0 - 5"]
    },
    description: {
        type: String,
        maxlength: [255, 'Description cannot be morethan 255 characters']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- ต้องเขียนพวก statics และ hook ก่อนส่งออก module.exports ---

// ฟังก์ชันคำนวณคะแนนเฉลี่ย (Static Method)
ReviewSchema.statics.getAverageRating = async function(restaurantId) {
    const obj = await this.aggregate([
        { $match: { restaurant: restaurantId } },
        {
            $group: {
                _id: '$restaurant',
                averageRating: { $avg: '$rating' },
                reviewCount: { $sum: 1 }
            }
        }
    ]);

    try {
        if (obj[0]) {
            await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
                averageRating: Math.round(obj[0].averageRating * 10) / 10,
                reviewCount: obj[0].reviewCount
            });
        } else {
            // ถ้ารีวิวถูกลบจนหมด ให้เซตกลับเป็น 0
            await this.model('Restaurant').findByIdAndUpdate(restaurantId, {
                averageRating: 0,
                reviewCount: 0
            });
        }
    } catch (err) {
        console.error(err);
    }
};

// เรียกใช้งานหลัง Save
ReviewSchema.post('save', function() {
    this.constructor.getAverageRating(this.restaurant);
});

// เรียกใช้งานก่อน Delete
ReviewSchema.pre('deleteOne', { document: true, query: false }, function() {
    this.constructor.getAverageRating(this.restaurant);
});

// ✅ ย้ายมาไว้ล่างสุดชัวร์กว่า
module.exports = mongoose.model('Review', ReviewSchema);