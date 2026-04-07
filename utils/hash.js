const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    console.log('📝 Hashing password:', password);
    
    if (!password) {
        throw new Error('Password is required');
    }
    
    if (typeof password !== 'string') {
        throw new Error('Password must be a string, but got: ' + typeof password);
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
}

async function comparePassword(password, hashedPassword) {
    if (!password || !hashedPassword) {
        throw new Error('Password and hash are required');
    }
    return await bcrypt.compare(password, hashedPassword);
}

module.exports = { hashPassword, comparePassword };