const express = require("express");
const pool = require("../config/db"); // Connexion à PostgreSQL
const router = express.Router();

// Middleware de protection des routes
const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

// Route d'inscription
router.post("/register", async (req, res) => {
  const { last, first, email, password, role } = req.body;

  console.log("Données reçues pour l'inscription :", req.body);

  if (!last || !first || !email || !password || !role) {
    return res.status(400).render("index", {
      page: "register",
      error: "Tous les champs sont requis !",
    });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      return res.status(400).render("index", { page: "register", error: "Cet email est déjà utilisé !" });
    }

    const newUser = await pool.query(
      "INSERT INTO users (last_name, first_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [last, first, email, password, role]
    );

    console.log("Utilisateur créé :", newUser.rows[0]);

    res.status(201).redirect("/login");
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).render("index", { page: "register", error: "Erreur interne du serveur !" });
  }
});

// Route de connexion
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Tentative de connexion pour :", email);
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0 || password !== result.rows[0].password) {
      return res.status(400).render("index", { page: "login", error: "Identifiants incorrects" });
    }

    req.session.user = result.rows[0];
    console.log("Utilisateur connecté :", req.session.user);
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).render("index", { page: "login", error: "Erreur interne du serveur" });
  }
});

// Route du tableau de bord
router.get("/dashboard", authMiddleware, (req, res) => {
  res.render("index", { page: "dashboard", user: req.session.user });
});

// Route de création de réunion
router.post("/create-meeting", authMiddleware, async (req, res) => {
  const { title, description } = req.body;
  const userId = req.session.user.id;

  if (!title || !description) {
    return res.status(400).render("index", { page: "create-meeting", error: "Tous les champs sont requis !" });
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
    res.status(500).render("index", { page: "create-meeting", error: "Erreur interne du serveur !" });
  }
});

// Route pour rejoindre une réunion
router.post("/join-meeting", authMiddleware, async (req, res) => {
  const { meetingId } = req.body;
  const userId = req.session.user.id;

  if (!meetingId) {
    return res.status(400).render("index", { page: "join-meeting", error: "L'ID de la réunion est requis !" });
  }

  try {
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE id = $1", [meetingId]);
    if (meetingResult.rows.length === 0) {
      return res.status(404).render("index", { page: "join-meeting", error: "Réunion non trouvée !" });
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const participantCheck = await pool.query(
      "SELECT * FROM meeting_participants WHERE meeting_id = $1 AND user_id = $2",
      [meetingId, userId]
    );

    if (participantCheck.rows.length === 0) {
      await pool.query(
        "INSERT INTO meeting_participants (meeting_id, user_id, response) VALUES ($1, $2, 'en attente')",
        [meetingId, userId]
      );
    }

    res.redirect(`/meeting/${meetingId}`);
  } catch (error) {
    console.error("Erreur lors de l'ajout à la réunion :", error);
    res.status(500).render("index", { page: "join-meeting", error: "Erreur interne du serveur !" });
  }
});

// Route pour afficher une réunion et ses participants
router.get("/meeting/:id", authMiddleware, async (req, res) => {
  const meetingId = req.params.id;

  try {
    const meetingResult = await pool.query("SELECT * FROM meetings WHERE id = $1", [meetingId]);

    if (meetingResult.rows.length === 0) {
      return res.status(404).render("index", { page: "meeting", error: "Réunion non trouvée !" });
    }

    const participantsResult = await pool.query(
      "SELECT users.first_name, users.last_name, meeting_participants.response FROM users " +
      "JOIN meeting_participants ON users.id = meeting_participants.user_id " +
      "WHERE meeting_participants.meeting_id = $1",
      [meetingId]
    );

    res.render("index", {
      page: "meeting",
      meeting: meetingResult.rows[0],
      participants: participantsResult.rows,
      user: req.session.user,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des détails de la réunion :", error);
    res.status(500).render("index", { page: "meeting", error: "Erreur interne du serveur !" });
  }
});

// Route pour afficher la page de création de réunion
router.get("/create-meeting", authMiddleware, (req, res) => {
  res.render("index", { page: "create-meeting", user: req.session.user });
});

// Route de déconnexion
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
