const express = require('express');
const { joinMeeting } = require('../controllers/joinMeetingController');
const router = express.Router();

router.post('/join-meeting', joinMeeting);

module.exports = router;
