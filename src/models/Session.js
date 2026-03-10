const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    secret: { type: String, required: true }, // Rotating secret for flickering QR
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
