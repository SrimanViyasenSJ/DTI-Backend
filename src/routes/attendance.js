const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const Classroom = require('../models/Classroom');
const { auth, authorize } = require('../middleware/auth');

// Haversine formula to check distance
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

// Mark Attendance (Student only)
router.post('/mark', [auth, authorize(['student'])], async (req, res) => {
    try {
        const { sessionId, secret, location } = req.body;

        const session = await Session.findById(sessionId).populate('classroom');
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return res.status(400).json({ msg: 'Session is inactive or expired' });
        }

        if (session.secret !== secret) {
            return res.status(400).json({ msg: 'Invalid QR Code' });
        }

        // Geofencing check
        const classroom = session.classroom;
        const distance = getDistance(
            location.lat, location.lng,
            classroom.location.lat, classroom.location.lng
        );

        if (distance > classroom.location.radius) {
            return res.status(400).json({ msg: 'You are outside the classroom geofence' });
        }

        // Floor check
        if (Math.abs(location.floor - classroom.location.floor) > 0.5) { // Allowing small deviation
            return res.status(400).json({ msg: 'Incorrect floor level detected' });
        }

        // Check if already marked
        const existing = await Attendance.findOne({ student: req.user.id, session: sessionId });
        if (existing) return res.status(400).json({ msg: 'Attendance already marked' });

        const attendance = new Attendance({
            student: req.user.id,
            session: sessionId,
            classroom: classroom._id,
            faculty: session.faculty,
            location
        });

        await attendance.save();
        res.json({ msg: 'Attendance marked successfully', attendance });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Get Student's Attendance History
router.get('/history', [auth, authorize(['student'])], async (req, res) => {
    try {
        const history = await Attendance.find({ student: req.user.id })
            .populate('classroom', 'name')
            .populate('faculty', 'name')
            .sort({ timestamp: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
