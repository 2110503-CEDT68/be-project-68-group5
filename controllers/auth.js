//ผู้ใช้งาน 
const User = require('../models/User');

// --- Helper Function ---
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
        data: user
    });
};

// @desc    Register user
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, tel, role, ranking } = req.body;

        const user = await User.create({
            name,
            email,
            password,
            tel,
            role,
            ranking
        });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.log(err.stack);
        res.status(400).json({ success: false });
    }
};

// @desc    Login user
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                msg: 'Please provide an email and password' 
            });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(400).json({ success: false, msg: 'Invalid credentials' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, msg: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            msg: 'Cannot convert email or password to string' 
        });
    }
};

// @desc    Get current logged in user
exports.getMe = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
        success: true,
        data: user
    });
};

// @desc    Log user out / clear cookie
exports.logout = async (req, res, next) => {
    res.cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({
        success: true,
        data: {}
    });
};

// @desc    Get all users (Admin only)
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find();
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (err) {
        res.status(400).json({ success: false });
    }
};