const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

router.get("/login", (req, res) => {
    res.render("auth/login", { error: null });
});

router.get("/register", (req, res) => {
    res.render("auth/register", { error: null });
});

router.post("/register", async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) return res.render("auth/register", { error: "Tous les champs sont requis" });

        const existingUser = await User.findByEmail(email);
        if (existingUser) return res.render("auth/register", { error: "Utilisateur déjà existant" });

        const newUser = await User.createUser(email, password, role);
        req.session.user = newUser;
        res.redirect("/dashboard");
    } catch (error) {
        res.render("auth/register", { error: "Erreur serveur" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.render("auth/login", { error: "Utilisateur non trouvé" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render("auth/login", { error: "Mot de passe incorrect" });

        req.session.user = user;
        res.redirect("/dashboard");
    } catch (error) {
        res.render("auth/login", { error: "Erreur serveur" });
    }
});

router.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("dashboard", { user: req.session.user });
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

module.exports = router;
