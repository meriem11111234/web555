const pool = require('../config/db');

// Fonction pour créer la réunion
const createMeeting = async (req, res) => {
  const { title, description } = req.body;
  const userId = req.session.user.id; // Supposons que l'ID de l'utilisateur soit dans la session

  try {
    // Insérer la réunion dans la base de données
    const result = await pool.query(
      "INSERT INTO meetings (title, description, creator_id) VALUES ($1, $2, $3) RETURNING id",
      [title, description, userId]
    );

    const meetingId = result.rows[0].id;

    // Ajouter l'organisateur à la liste des participants (statut 'organisateur')
    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'organisateur')",
      [meetingId, userId]
    );

    // Rediriger vers une page où l'utilisateur peut voir le lien de la réunion
    res.redirect(`/meeting/${meetingId}`);
  } catch (error) {
    console.error("Erreur lors de la création de la réunion :", error);
    res.status(500).render("index", {
      page: "create-meeting",
      error: "Erreur interne du serveur lors de la création de la réunion !",
    });
  }
};

module.exports = { createMeeting };
