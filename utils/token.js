const jwt = require('jsonwebtoken');
require('dotenv').config();

function generateToken(userId, email) {
    // Make sure JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in .env file');
    }
    
    const payload = {
        id: userId,
        email: email
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
    
    return token;
}

function verifyToken(token) {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in .env file');
    }
    
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { generateToken, verifyToken };