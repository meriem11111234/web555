const pool = require('../config/db');

/*Fonction appelée depuis une route ( quand on clique sur envoyer ma réponse ) */
const saveSlotResponses = async (req, res) => {
  const userId = req.session.user.id;
  const { meeting_id, ...responses } = req.body;

  try {
    // On  supprime les anciennes réponses de l'utilisateur pour cette réunion
    await pool.query(`
      DELETE FROM slot_responses 
      WHERE user_id = $1 
      AND slot_id IN (SELECT id FROM meeting_slots WHERE meeting_id = $2)
    `, [userId, meeting_id]);

    //  On insérer les nouvelles réponses
    for (const key in responses) {
      if (key.startsWith("response_")) {   //On vérifie que la clé commence bien par reponse_
        const slotId = key.split("_")[1];  //on extrait l'id du crénau
        const response = responses[key];

        await pool.query(`
          INSERT INTO slot_responses (slot_id, user_id, response)
          VALUES ($1, $2, $3)
        `, [slotId, userId, response]);
      }
    }

    // Ensuite  redirection  vers la page de la réunion
    const codeResult = await pool.query("SELECT code FROM meetings WHERE id = $1", [meeting_id]);
    const code = codeResult.rows[0].code;

    res.redirect(`/meeting/code/${code}`);

  } catch (error) {
    console.error("Erreur lors de l'enregistrement des réponses :", error);
    res.status(500).send("Erreur serveur");
  }
};

module.exports = { saveSlotResponses };