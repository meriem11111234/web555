const express = require("express");
const router = express.Router();
const {
  createMeeting,
  renderCreateMeetingPage,
  getMeetingDetails,
  showInvitationPage,
  respondToInvitation
} = require("../controllers/meetingController");

// Route pour afficher la page de création
router.get("/create-meeting", renderCreateMeetingPage);

// Route pour créer une réunion (appelée depuis un formulaire)
router.post("/create-meeting", createMeeting);

// Route API directe 
router.post("/", createMeeting);

// Route pour afficher une réunion par code
router.get("/meeting/code/:code", getMeetingDetails);
router.get("/invitation", showInvitationPage);
router.post("/invitation/respond", respondToInvitation);



module.exports = router;