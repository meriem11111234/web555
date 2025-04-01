require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const db = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware de base
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration d'EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configuration de la session
app.use(session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: true
}));

// Middleware pour rendre les variables de session accessibles dans toutes les vues
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes API
app.use("/api/users", userRoutes);

// Routes EJS pour l'authentification
app.use(authRoutes);

// Page d'accueil
app.get("/", (req, res) => {
    res.render("index", { title: "Accueil", page: "home", user: req.session.user });
});

// Route pour afficher la page de connexion
app.get("/login", (req, res) => {
    res.render("index", { title: "Connexion", page: "login", error: null });
});

// Route pour afficher la page d'inscription
app.get("/register", (req, res) => {
    res.render("index", { title: "Inscription", page: "register" });
});

// Route pour afficher le tableau de bord
app.get("/dashboard", (req, res) => {
    if (req.session.user) {
        res.render("index", { title: "Tableau de bord", page: "dashboard", user: req.session.user });
    } else {
        res.redirect("/login");
    }
});

// Route pour se déconnecter
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send("Erreur lors de la déconnexion");
        }
        res.redirect("/"); // Rediriger à la page d'accueil après déconnexion
    });
});

// Lancer le serveur sur un port aléatoire
const server = app.listen(0, () => { 
    const port = server.address().port;
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});
