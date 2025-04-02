const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Route pour rejoindre une réunion
router.post('/:id', async (req, res) => {
  const meetingId = req.params.id;
  const userId = req.session.user.id;  // L'ID de l'utilisateur connecté

  try {
    // Vérifier si la réunion existe
    const result = await pool.query("SELECT * FROM meetings WHERE id = $1", [meetingId]);
    if (result.rows.length === 0) {
      return res.status(404).render("index", {
        page: "join-meeting",
        error: "Réunion non trouvée !",
      });
    }

    // Ajouter l'utilisateur à la réunion (statut 'en attente' ou autre)
    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'en attente')",
      [meetingId, userId]
    );

    // Rediriger l'utilisateur vers la page de la réunion
    res.redirect(`/meeting/${meetingId}`);
  } catch (error) {
    console.error("Erreur lors de l'ajout à la réunion :", error);
    res.status(500).render("index", {
      page: "join-meeting",
      error: "Erreur interne du serveur lors du rejoint !",
    });
  }
});

module.exports = router;
