const express = require('express');
const multer = require("multer");
const fs = require("fs");
const ical = require("node-ical");
const upload = multer({ dest: "uploads/" });
const router = express.Router();
const { submitAvailability } = require('../controllers/availabilityController');
const pool = require("../config/db"); 

router.post('/submit', submitAvailability);  //redirige vers la focntion dans controllers 
/*Une route qui permet à l'utilisateur d'envoyer ses disponibilités en AJAX (sans recharger la page) */
router.post("/submit-ajax", async (req, res) => {
    const { meeting_id, start_time, end_time } = req.body;
    const user_id = req.session.user.id;
  
    try {
      await pool.query(
        "INSERT INTO availabilities (user_id, meeting_id, start_time, end_time) VALUES ($1, $2, $3, $4)",
        [user_id, meeting_id, start_time, end_time]
      );
  
      res.json({ meeting_id, start_time, end_time }); // Une fois que l'insertion est faite , on renvoie une réponse au front-end ai format JSON 
    } catch (error) {
      console.error("Erreur AJAX :", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
  
  /*Une route qui permet d'importer le fichier .ics */
  router.post("/import-ics", upload.single("icsFile"), async (req, res) => {
    const filePath = req.file.path;   //ça c'est le chemin temporaire ou le Multer a stocké le fichier .ics
    const user_id = req.session.user.id;
  
    try {
      const data = await ical.parseFile(filePath); //Pour lire le fichier .ics
      const inserts = [];
  
      for (const k in data) {  // Pour chaque élement du fichier
        const event = data[k];
        if (event.type === "VEVENT") {  // Il faut qu'il soit VEVENT pas un autre type 
          inserts.push(pool.query(
            "INSERT INTO availabilities (user_id, start_time, end_time) VALUES ($1, $2, $3)",
            [user_id, event.start, event.end]
          ));
        }
      }
  
      await Promise.all(inserts);  // exécute toutes les requêtes SQL en parallèle 
      fs.unlinkSync(filePath);
      res.redirect("/ajouter-disponibilite");
    } catch (err) {
      console.error("Erreur import .ics :", err);
      res.status(500).send("Erreur lors de l'import");
    }
  });

module.exports = router;

