const express = require('express');
const router = express.Router();
const Classroom = require('../models/Classroom');
const Session = require('../models/Session');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

// Create Classroom (Faculty only)
router.post('/', [auth, authorize(['faculty'])], async (req, res) => {
    try {
        const { name, location } = req.body;
        const classroom = new Classroom({
            name,
            location,
            faculty: req.user.id
        });
        await classroom.save();
        res.json(classroom);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Start Attendance Session (Faculty only)
router.post('/:id/session', [auth, authorize(['faculty'])], async (req, res) => {
    try {
        const classroom = await Classroom.findById(req.params.id);
        if (!classroom) return res.status(404).json({ msg: 'Classroom not found' });

        // Generate a temporary secret for the flickering QR
        const secret = crypto.randomBytes(32).toString('hex');

        const session = new Session({
            classroom: req.params.id,
            faculty: req.user.id,
            secret,
            expiresAt: new Date(Date.now() + 30 * 60000) // 30 mins
        });

        await session.save();
        res.json(session);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Get Faculty's Classrooms
router.get('/faculty', [auth, authorize(['faculty'])], async (req, res) => {
    try {
        const classrooms = await Classroom.find({ faculty: req.user.id });
        res.json(classrooms);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

module.exports = router;
