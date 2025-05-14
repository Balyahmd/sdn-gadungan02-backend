import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import User from '../models/User.js';

// export const authenticate = async (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader?.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'Unauthorized' });
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.id);

//         if (!user) {
//             return res.status(401).json({ message: 'User not found' });
//         }

//         req.user = user;
//         next();
//     } catch (error) {
//         return res.status(403).json({ message: 'Forbidden' });
//     }
// };

// secondary
export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Tambahkan data user lengkap ke request
        req.user = {
            id: user.id,
            name: user.name || user.username, // Gunakan username jika name tidak ada
            email: user.email,
            role: user.role
        };

        next();
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden' });
    }
};

// Middleware untuk route yang wajib auth
export const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }
    next();
};