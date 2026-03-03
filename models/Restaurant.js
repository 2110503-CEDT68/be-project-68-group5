// ฟีล เเต่ละ table ของ ร้านอาหาร
const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add a address']
    },
    tel: {
        type: String,
    },
    opentime: {
        type: String,
        required: [true, 'Please add a restaurant opening time']
    },
    closetime: {
        type: String,
        required: [true, 'Please add a restaurant closing time']
    },
    // ✅ เพิ่มฟิลด์สำหรับคะแนนเฉลี่ย
    averageRating: {
        type: Number,
        default: 0
    },
    // ✅ เพิ่มฟิลด์สำหรับนับจำนวนรีวิว
    reviewCount: {
        type: Number,
        default: 0
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Middleware: ลบการจองและรีวิวทั้งหมดเมื่อร้านถูกลบ (Cascade Delete)
RestaurantSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    console.log(`Reservations and Reviews being removed from restaurant ${this._id}`);
    await this.model('Reservation').deleteMany({ restaurant: this._id });
    await this.model('Review').deleteMany({ restaurant: this._id });
    next();
});

// Virtual: ดึงข้อมูลการจองมาแสดงใน Restaurant (แต่ไม่เก็บลง DB)
RestaurantSchema.virtual('reservations', {
    ref: 'Reservation',
    localField: '_id',
    foreignField: 'restaurant',
    justOne: false
});

module.exports = mongoose.model('Restaurant', RestaurantSchema);