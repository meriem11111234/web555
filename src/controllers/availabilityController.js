const pool = require("../config/db");
/* Focntion : pour génrer une requête HTTP */
const submitAvailability = async (req, res) => {
    const { meeting_id, start_time, end_time } = req.body;    //On extrait les données du formulaire 
    const user_id = req.session.user.id;
  
    try {
      await pool.query(
        "INSERT INTO availabilities (user_id, meeting_id, start_time, end_time) VALUES ($1, $2, $3, $4)",
        [user_id, meeting_id, start_time, end_time]
      );
      // Redirige vers le tableau de bord 
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Erreur lors de l'ajout de la disponibilité :", error);
      res.status(500).send("Erreur interne serveur");
    }
  };
  
module.exports = { submitAvailability };