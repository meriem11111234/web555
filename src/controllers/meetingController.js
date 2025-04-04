const pool = require('../config/db');

// Génère un code de réunion aléatoire
function generateMeetingCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Créer une réunion (POST /api/meetings)
const createMeeting = async (req, res) => {
  const { title, description } = req.body;
  const userId = req.session.user.id;

  try {
    const code = generateMeetingCode();

    const result = await pool.query(
      "INSERT INTO meetings (title, description, creator_id, code) VALUES ($1, $2, $3, $4) RETURNING code",
      [title, description, userId, code]
    );

    const meetingCode = result.rows[0].code;

    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ((SELECT id FROM meetings WHERE code = $1), $2, 'organisateur')",
      [meetingCode, userId]
    );

    res.redirect(`/meeting/code/${meetingCode}`);
  } catch (error) {
    console.error("Erreur lors de la création de la réunion :", error);
    res.status(500).render("index", {
      page: "create-meeting",
      error: "Erreur interne du serveur lors de la création de la réunion !",
    });
  }
};

// Afficher la page de création de réunion (GET /api/meetings/create-meeting)
const renderCreateMeetingPage = (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("index", { page: "create-meeting", user: req.session.user });
};

// Afficher les détails d’une réunion (GET /api/meetings/meeting/code/:code)
const getMeetingDetails = async (req, res) => {
  const meetingCode = req.params.code;

  if (!req.session.user) return res.redirect("/login");

  try {
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE code = $1", [meetingCode]);
    const meeting = meetingResult.rows[0];

    if (!meeting) {
      return res.status(404).render("index", { page: "meeting", error: "Réunion non trouvée !" });
    }

    const participantsResult = await pool.query(
      "SELECT users.first_name, users.last_name, meeting_participants.response FROM users JOIN meeting_participants ON users.id = meeting_participants.user_id WHERE meeting_participants.meeting_id = $1",
      [meeting.id]
    );

    res.render("index", {
      page: "meeting",
      meeting,
      participants: participantsResult.rows,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de la réunion :", error);
    res.status(500).render("index", { page: "meeting", error: "Erreur interne du serveur !" });
  }
};

module.exports = {
  createMeeting,
  renderCreateMeetingPage,
  getMeetingDetails,
};
