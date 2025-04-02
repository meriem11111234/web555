const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Route pour afficher la page de connexion
router.get("/login", (req, res) => {
  res.render("index", {
    page: "login", // Cette variable permet de rendre la section de connexion
    error: null,
    title: "Connexion",
    user: req.session.user, // Pour récupérer l'utilisateur connecté
  });
});

// Route pour afficher la page d'inscription
router.get("/register", (req, res) => {
  res.render("index", {
    page: "register", // Cette variable permet de rendre la section d'inscription
    error: null,
    title: "Inscription",
    user: req.session.user, // Pour récupérer l'utilisateur connecté
  });
});

// Route pour traiter l'inscription
router.post("/register", async (req, res) => {
  try {
    const { last, first, email, password, role } = req.body;
    if (!last || !first || !email || !password)
      return res.render("index", { page: "register", error: "Tous les champs sont requis" });

    const existingUser = await User.findByEmail(email);
    if (existingUser)
      return res.render("index", { page: "register", error: "Utilisateur déjà existant" });

    const newUser = await User.createUser(last, first, email, password, role);
    req.session.user = newUser;
    res.redirect("/dashboard");
  } catch (error) {
    res.render("index", { page: "register", error: "Erreur serveur" });
  }
});

// Route pour traiter la connexion
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Tentative de connexion pour l'email :", email);

    // Recherche de l'utilisateur par email dans la base de données
    const user = await User.findByEmail(email);

    // Si l'utilisateur n'existe pas
    if (!user) {
      console.log("Utilisateur non trouvé pour l'email :", email);
      return res.render("index", { page: "login", error: "Utilisateur non trouvé" });
    }

    // Affichage du mot de passe stocké (en clair) dans la base de données
    console.log("Mot de passe stocké en clair dans la base de données :", user.password);

    // Comparaison du mot de passe fourni avec celui stocké en clair dans la base de données
    if (password !== user.password) {
      console.log("Le mot de passe saisi ne correspond pas au mot de passe stocké.");
      return res.render("index", { page: "login", error: "Mot de passe incorrect" });
    }

    // Si tout est correct, on crée une session pour l'utilisateur
    console.log("Connexion réussie pour l'utilisateur :", email);
    req.session.user = user;

    // Redirection vers le tableau de bord
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Erreur lors de la tentative de connexion :", error);
    res.render("index", { page: "login", error: "Erreur serveur" });
  }
});

// Route pour afficher le tableau de bord
router.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login"); // Rediriger si l'utilisateur n'est pas connecté
  res.render("index", {
    page: "dashboard", // Cette variable permet de rendre la section du tableau de bord
    user: req.session.user,
    title: "Tableau de bord",
  });
});

// Route pour se déconnecter
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

module.exports = router;
