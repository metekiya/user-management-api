const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateToken } = require('../utils/token');

// Register User
async function register(req, res) {
    console.log('🔥 Register function called');
    console.log('Body received:', req.body);
    
    try {
        const { name, email, password } = req.body;
        
        // Check if all fields exist
        if (!name || !email || !password) {
            console.log('❌ Missing fields');
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }
        
        console.log('✅ Fields OK, hashing password...');
        const hashedPassword = await hashPassword(password);
        console.log('✅ Password hashed');
        
        console.log('💾 Saving to database...');
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );
        
        console.log('✅ User saved, ID:', result.insertId);
        
        console.log('🔑 Generating token...');
        const token = generateToken(result.insertId, email);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token: token,
                user: {
                    id: result.insertId,
                    name: name,
                    email: email
                }
            }
        });
    } catch (error) {
        console.error('❌ Registration error:', error.message);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
}

// Login User
async function login(req, res) {
    console.log('🔐 Login function called');
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        const [rows] = await db.execute(
            'SELECT id, name, email, password FROM users WHERE email = ?',
            [email]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const user = rows[0];
        const isValid = await comparePassword(password, user.password);
        
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        const token = generateToken(user.id, user.email);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: { token }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
}

// Get User Profile
async function getProfile(req, res) {
    const userId = parseInt(req.params.id);
    const loggedInUserId = req.user.id;
    
    if (userId !== loggedInUserId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only access your own account'
        });
    }
    
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User fetched successfully',
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
}

// Update User
async function updateUser(req, res) {
    const userId = parseInt(req.params.id);
    const loggedInUserId = req.user.id;
    const { name, password } = req.body;
    
    if (userId !== loggedInUserId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only modify your own account'
        });
    }
    
    if (!name && !password) {
        return res.status(400).json({
            success: false,
            message: 'At least one field (name or password) is required'
        });
    }
    
    try {
        let updateQuery = 'UPDATE users SET ';
        const updateValues = [];
        
        if (name) {
            updateQuery += 'name = ?, ';
            updateValues.push(name);
        }
        
        if (password) {
            const hashedPassword = await hashPassword(password);
            updateQuery += 'password = ?, ';
            updateValues.push(hashedPassword);
        }
        
        updateQuery = updateQuery.slice(0, -2);
        updateQuery += ' WHERE id = ?';
        updateValues.push(userId);
        
        await db.execute(updateQuery, updateValues);
        
        const [rows] = await db.execute(
            'SELECT id, name, email FROM users WHERE id = ?',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: rows[0]
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Update failed',
            error: error.message
        });
    }
}

// Delete User
async function deleteUser(req, res) {
    const userId = parseInt(req.params.id);
    const loggedInUserId = req.user.id;
    
    if (userId !== loggedInUserId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You can only delete your own account'
        });
    }
    
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Deletion failed',
            error: error.message
        });
    }
}

module.exports = {
    register,
    login,
    getProfile,
    updateUser,
    deleteUser
};