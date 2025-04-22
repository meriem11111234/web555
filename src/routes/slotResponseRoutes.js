const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/api/slot-response", async (req, res) => {
  try {
    const { meeting_id, accepted_slot_id, email, responseType } = req.body;

    let userId;

    // Si l'utilisateur est connecté, prendre son ID depuis la session
    if (req.session.user) {
      userId = req.session.user.id;
    } else {
      if (!email) return res.status(400).json({ message: "Email requis" });

      // Rechercher si l'utilisateur existe
      const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);

      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      } else {
        // Créer un utilisateur "invité" si non existant
        const newUser = await pool.query(
          "INSERT INTO users (email, first_name, last_name, password, role) VALUES ($1, '', '', '', 'invité') RETURNING id",
          [email]
        );
        userId = newUser.rows[0].id;
      }
    }

    // Ajouter le participant s'il n'est pas encore enregistré pour cette réunion
    const existingParticipant = await pool.query(
      "SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2",
      [meeting_id, userId]
    );

    if (existingParticipant.rows.length === 0) {
      await pool.query(
        "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'invité')",
        [meeting_id, userId]
      );
    }

    // Supprimer les réponses précédentes de ce participant
    await pool.query("DELETE FROM slot_responses WHERE user_id = $1 AND slot_id IN (SELECT id FROM meeting_slots WHERE meeting_id = $2)", [userId, meeting_id]);

    // Si la personne a refusé, on s'arrête ici
    if (responseType === "refusé") {
      return res.status(200).json({ message: "Invitation refusée." });
    }

    // Enregistrer la réponse à un créneau
    await pool.query(
      "INSERT INTO slot_responses (slot_id, user_id, response) VALUES ($1, $2, 'accepté')",
      [accepted_slot_id, userId]
    );

    return res.status(200).json({ message: "Réponse enregistrée !" });
  } catch (err) {
    console.error("Erreur slot-response:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
