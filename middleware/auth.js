// ด่านตรวจความปลอดภัย
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @desc    Protect routes - ตรวจสอบว่า User มี Token ที่ถูกต้องหรือไม่
exports.protect = async (req, res, next) => {
    let token;

    // 1. ตรวจสอบว่ามี Token ส่งมาใน Header หรือไม่
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. ถ้าไม่มี Token หรือ Token เป็นค่าว่าง (null) ให้ปฏิเสธการเข้าถึง
    if (!token || token === 'null') {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // 3. ตรวจสอบความถูกต้องของ Token (Verify JWT)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Decoded Token User ID:', decoded.id);

        // 4. ค้นหา User จาก ID ที่อยู่ใน Token และแนบข้อมูล User ไปกับ request object
        req.user = await User.findById(decoded.id);

        next();
    } catch (err) {
        console.log(err.stack);
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// @desc    Authorize - ตรวจสอบว่า User มี Role ที่ได้รับอนุญาตหรือไม่
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};