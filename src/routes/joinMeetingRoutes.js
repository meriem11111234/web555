const express = require('express');
const { joinMeeting } = require('../controllers/joinMeetingController');
const router = express.Router();

router.post('/', joinMeeting);

module.exports = router;
