const pool = require('../config/db');

// Fonction pour générer un code aléatoire
function generateMeetingCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fonction pour créer la réunion
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

module.exports = { createMeeting };
