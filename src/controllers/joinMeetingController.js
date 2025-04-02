const pool = require('../config/db');

// Fonction pour rejoindre une réunion
const joinMeeting = async (req, res) => {
  const { meetingId } = req.body;
  const userId = req.session.user.id; // ID de l'utilisateur en session

  try {
    // Vérifier si la réunion existe
    const meetingCheck = await pool.query("SELECT * FROM meetings WHERE id = $1", [meetingId]);
    if (meetingCheck.rows.length === 0) {
      return res.status(404).render("index", { page: "join-meeting", error: "Réunion introuvable" });
    }

    // Vérifier si l'utilisateur est déjà inscrit à cette réunion
    const participantCheck = await pool.query(
      "SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2",
      [meetingId, userId]
    );

    if (participantCheck.rows.length > 0) {
      return res.redirect(`/meeting/${meetingId}`); // Déjà inscrit, on le redirige vers la réunion
    }

    // Ajouter l'utilisateur comme participant (statut 'participant')
    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'participant')",
      [meetingId, userId]
    );

    // Rediriger l'utilisateur vers la réunion
    res.redirect(`/meeting/${meetingId}`);
  } catch (error) {
    console.error("Erreur lors de la tentative de rejoindre la réunion :", error);
    res.status(500).render("index", {
      page: "join-meeting",
      error: "Erreur serveur lors de la tentative de rejoindre la réunion",
    });
  }
};

module.exports = { joinMeeting };
