const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/*Une route pour que le user envoie sa réponse concernant le créneau proposé */
router.post("/", async (req, res) => {
    const userId = req.session.user.id;
    const { meeting_id, accepted_slot_id } = req.body;
  
    try {
      // Supprimer les anciennes réponses de ce user pour cette réunion
      await pool.query(`
        DELETE FROM slot_responses 
        WHERE user_id = $1 AND slot_id IN (
          SELECT id FROM meeting_slots WHERE meeting_id = $2
        )
      `, [userId, meeting_id]);
  
      // Ajouter la nouvelle réponse 
      await pool.query(
        "INSERT INTO slot_responses (slot_id, user_id, response) VALUES ($1, $2, 'accepté')",
        [accepted_slot_id, userId]
      );
  
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Erreur lors de l’enregistrement :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  /*Une route pour récupérer toutes les réponses des utilisateurs  */
  router.get("/meeting/:meetingId/responses", async (req, res) => {
    const meetingId = req.params.meetingId;
  
    try {
      const allSlotResponsesResult = await pool.query(`
        SELECT slot_id, user_id, response 
        FROM slot_responses 
        WHERE slot_id IN (
          SELECT id FROM meeting_slots WHERE meeting_id = $1
        )
      `, [meetingId]);
  
      res.json(allSlotResponsesResult.rows);
    } catch (error) {
      console.error("Erreur récupération réponses :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  
module.exports = router;