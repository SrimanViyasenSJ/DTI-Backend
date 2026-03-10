const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    location: {
        lat: Number,
        lng: Number,
        floor: Number
    }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
