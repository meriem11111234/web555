const express = require("express");
const pool = require("../config/db");
const router = express.Router();

// Supposons que tu aies une fonction pour gérer la création de réunion
const { createMeeting } = require("../controllers/meetingController");

// Route pour créer une réunion
router.post("/", createMeeting); // Cette route va écouter sur /api/meetings

// Route pour afficher la page de création de réunion
router.get("/create-meeting", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("index", { page: "create-meeting", user: req.session.user });
});

// Route pour créer une réunion
router.post("/create-meeting", async (req, res) => {
  const { title, description } = req.body;
  const userId = req.session.user.id;

  if (!title || !description) {
    return res
      .status(400)
      .render("index", { page: "create-meeting", error: "Tous les champs sont requis !" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO meetings (title, description, creator_id) VALUES ($1, $2, $3) RETURNING id",
      [title, description, userId]
    );

    const meetingId = result.rows[0].id;

    await pool.query(
      "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'organisateur')",
      [meetingId, userId]
    );

    res.redirect(`/meeting/${meetingId}`);
  } catch (error) {
    console.error("Erreur lors de la création de la réunion :", error);
    res
      .status(500)
      .render("index", { page: "create-meeting", error: "Erreur interne du serveur !" });
  }
});

// Route pour afficher les détails d'une réunion
router.get("/meeting/:id", async (req, res) => {
  if (req.session.user) {
    const meetingId = req.params.id;

    try {
      const meetingResult = await pool.query("SELECT * FROM meetings WHERE id = $1", [meetingId]);
      const meeting = meetingResult.rows[0];

      if (!meeting) {
        return res.status(404).render("index", { page: "meeting", error: "Réunion non trouvée !" });
      }

      const participantsResult = await pool.query(
        "SELECT users.first_name, users.last_name, meeting_participants.response FROM users JOIN meeting_participants ON users.id = meeting_participants.user_id WHERE meeting_participants.meeting_id = $1",
        [meetingId]
      );

      res.render("index", {
        page: "meeting",
        meeting,
        participants: participantsResult.rows,
        user: req.session.user,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de la réunion :", error);
      res.status(500).render("index", { page: "meeting", error: "Erreur interne du serveur !" });
    }
  } else res.redirect("/login");
});

module.exports = router;
