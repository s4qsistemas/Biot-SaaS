const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('🚨 ERROR FATAL: JWT_SECRET no está definido en el archivo .env. El servidor no puede arrancar de forma segura.');
    process.exit(1);
}

const JWT_EXPIRES_IN = '1d';

const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken
};