const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Route pour afficher la page de connexion
router.get("/login", (req, res) => {
    res.render("index", { 
        page: 'login', // Cette variable permet de rendre la section de connexion
        error: null,
        title: "Connexion",
        user: req.session.user // Pour récupérer l'utilisateur connecté
    });
});

// Route pour afficher la page d'inscription
router.get("/register", (req, res) => {
    res.render("index", { 
        page: 'register', // Cette variable permet de rendre la section d'inscription
        error: null,
        title: "Inscription",
        user: req.session.user // Pour récupérer l'utilisateur connecté
    });
});

// Route pour traiter l'inscription
router.post("/register", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) return res.render("index", { page: 'register', error: "Tous les champs sont requis" });

        const existingUser = await User.findByEmail(email);
        if (existingUser) return res.render("index", { page: 'register', error: "Utilisateur déjà existant" });

        const newUser = await User.createUser(email, password, role);
        req.session.user = newUser;
        res.redirect("/dashboard");
    } catch (error) {
        res.render("index", { page: 'register', error: "Erreur serveur" });
    }
});

// Route pour traiter la connexion
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.render("index", { page: 'login', error: "Utilisateur non trouvé" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render("index", { page: 'login', error: "Mot de passe incorrect" });

        req.session.user = user;
        res.redirect("/dashboard");
    } catch (error) {
        res.render("index", { page: 'login', error: "Erreur serveur" });
    }
});

// Route pour afficher le tableau de bord
router.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/login"); // Rediriger si l'utilisateur n'est pas connecté
    res.render("index", { 
        page: 'dashboard', // Cette variable permet de rendre la section du tableau de bord
        user: req.session.user,
        title: "Tableau de bord"
    });
});

// Route pour se déconnecter
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

module.exports = router;
