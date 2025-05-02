const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/", async (req, res) => {
  try {
    console.log("➡️ Requête reçue :", req.body);

    const { meeting_id, accepted_slot_id, email, responseType } = req.body;

    if (!meeting_id || (!accepted_slot_id && responseType !== "refuse")) {
      console.log("❌ Données manquantes !");
      return res.status(400).json({ message: "Données manquantes" });
    }

    let userId;

    // 🔒 Si utilisateur connecté
    if (req.session.user) {
      userId = req.session.user.id;
      console.log("🔐 Utilisateur connecté, ID :", userId);
    } else {
      if (!email) return res.status(400).json({ message: "Email requis" });
      console.log("🔎 Vérification de l'utilisateur invité par email :", email);

      const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        console.log("👤 Utilisateur existant trouvé, ID :", userId);
      } else {
        const newUser = await pool.query(
          "INSERT INTO users (email, first_name, last_name, password, role) VALUES ($1, '', '', '', 'invité') RETURNING id",
          [email]
        );
        userId = newUser.rows[0].id;
        console.log("➕ Nouvel utilisateur invité créé, ID :", userId);
      }
    }

    // 👥 Vérifier s'il est déjà participant
    const existingParticipant = await pool.query(
      "SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2",
      [meeting_id, userId]
    );
    if (existingParticipant.rows.length === 0) {
      await pool.query(
        "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'invité')",
        [meeting_id, userId]
      );
      console.log("👥 Participant ajouté à la réunion.");
    }

    // 🧹 Supprimer les anciennes réponses
    await pool.query(
      "DELETE FROM slot_responses WHERE user_id = $1 AND slot_id IN (SELECT id FROM meeting_slots WHERE meeting_id = $2)",
      [userId, meeting_id]
    );
    console.log("🧹 Anciennes réponses supprimées pour cet utilisateur.");

    // ❌ Si refuse, on s'arrête ici
    if (responseType === "refuse") {
      console.log("🚫 Invitation refusee.");
      return res.status(200).json({ message: "Invitation refusee." });
    }

    const codeResult = await pool.query("SELECT code FROM meetings WHERE id = $1", [meeting_id]);
const code = codeResult.rows[0].code;


    // ✅ Enregistrer la nouvelle réponse
    await pool.query(
      "INSERT INTO slot_responses (slot_id, user_id, response) VALUES ($1, $2, 'accepte')",
      [accepted_slot_id, userId]
    );
    console.log("✅ Créneau accepte enregistré pour slot :", accepted_slot_id);

    return res.status(200).json({ message: "Réponse enregistrée !" });
  } catch (err) {
    console.error("❌ Erreur slot-response:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/reject", async (req, res) => {
  try {
    const { meeting_id, email } = req.body;

    console.log("📩 Requête rejet reçue :", req.body);

    if (!meeting_id) {
      return res.status(400).json({ message: "meeting_id manquant" });
    }

    let userId = null;

    if (req.session.user) {
      userId = req.session.user.id;
    } else if (email) {
      // 🔍 Vérifie si l'utilisateur existe
      const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
        console.log("👤 Utilisateur invité trouvé :", userId);
      } else {
        // ➕ Sinon, créer un utilisateur invité
        const newUser = await pool.query(
          "INSERT INTO users (email, first_name, last_name, password, role) VALUES ($1, '', '', '', 'invité') RETURNING id",
          [email]
        );
        userId = newUser.rows[0].id;
        console.log("➕ Nouvel utilisateur invité créé :", userId);
      }
    }

    if (!userId) {
      return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    const existing = await pool.query(
      "SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2",
      [meeting_id, userId]
    );
    
    if (existing.rows.length === 0) {
      await pool.query(
        "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'refuse')",
        [meeting_id, userId]
      );
      console.log("➕ Participant ajouté avec statut 'refuse'.");
    } else {
      await pool.query(`
        UPDATE meeting_participants
        SET response = 'refuse'
        WHERE meeting_id = $1 AND user_id = $2
      `, [meeting_id, userId]);
      console.log(`🛑 Statut mis à 'refuse' pour user_id = ${userId}`);
    }
        

    return res.status(200).json({ message: "Invitation refusée." });

  } catch (err) {
    console.error("❌ Erreur slot-response/reject:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});



module.exports = router;
