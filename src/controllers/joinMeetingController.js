const pool = require('../config/db');

// Fonction pour rejoindre une réunion
const joinMeeting = async (req, res) => {
  const { meetingCode } = req.body;
  const userId = req.session.user.id;

  try {
    const meetingCheck = await pool.query("SELECT * FROM meetings WHERE code = $1", [meetingCode]);

    if (meetingCheck.rows.length === 0) {
      return res.status(404).render("index", { page: "join-meeting", error: "Réunion introuvable" });
    }

    const meetingId = meetingCheck.rows[0].id;

    const participantCheck = await pool.query(
      "SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2",
      [meetingId, userId]
    );

    if (participantCheck.rows.length > 0) {
      return res.redirect(`/meeting/code/${meetingCode}`);
    }

    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'participant')",
      [meetingId, userId]
    );

    res.redirect(`/meeting/code/${meetingCode}`);
  } catch (error) {
    console.error("Erreur lors de la tentative de rejoindre la réunion :", error);
    res.status(500).render("index", {
      page: "join-meeting",
      error: "Erreur serveur lors de la tentative de rejoindre la réunion",
    });
  }
};

// Afficher la page "rejoindre une réunion"
const renderJoinMeetingPage = (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("index", { page: "join-meeting", user: req.session.user });
};

module.exports = {
  joinMeeting,
  renderJoinMeetingPage,
};
