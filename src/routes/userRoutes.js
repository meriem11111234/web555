const express = require("express");
const pool = require("../config/db"); // Connexion à PostgreSQL
const router = express.Router();

// Route d'inscription
router.post("/register", async (req, res) => {
  const { last, first, email, password, role } = req.body;

  if (!last || !first || !email || !password || !role) {
    return res.status(400).render("index", {
      page: "register",
      error: "Tous les champs sont requis !",
    });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length > 0) {
      return res.status(400).render("index", {
        page: "register",
        error: "Cet email est déjà utilisé !",
      });
    }

    // Stockage du mot de passe en clair (⚠️ à améliorer avec bcrypt)
    const newUser = await pool.query(
      "INSERT INTO users (last_name, first_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [last, first, email, password, role]
    );

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
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).render("index", { page: "login", error: "Utilisateur non trouvé" });
    }

    const user = result.rows[0];

    if (password !== user.password) {
      return res.status(400).render("index", { page: "login", error: "Mot de passe incorrect" });
    }

    req.session.user = user;
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    res.status(500).render("index", { page: "login", error: "Erreur interne du serveur" });
  }
});

// Route pour le tableau de bord
router.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("index", { page: "dashboard", user: req.session.user });
});

// Route de déconnexion
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
