require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const session = require("express-session");
const db = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const joinMeetingRoutes = require("./routes/joinMeetingRoutes");

const app = express();

// Middleware de base
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Configuration d'EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Configuration de la session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secretkey",
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware pour rendre les variables de session accessibles dans toutes les vues
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes API
app.use("/api/users", userRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/join-meeting", joinMeetingRoutes);

// Route POST pour rejoindre une réunion avec le code
app.post("/api/join-meeting", (req, res) => {
  const meetingId = req.body.meetingId;
  // Cherche la réunion dans la base de données
  db.query("SELECT * FROM meetings WHERE id = $1", [meetingId], (err, result) => {
    if (err) {
      return res.send("Erreur lors de la recherche de la réunion.");
    }

    if (result.rows.length === 0) {
      return res.send("Réunion non trouvée.");
    }

    // Si la réunion existe, redirige vers la page de la réunion
    res.redirect(`/meeting/${meetingId}`);
  });
});

// Routes EJS pour l'authentification et les utilisateurs
app.use(userRoutes);
app.use(meetingRoutes);
app.use(joinMeetingRoutes);

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
  if (req.session.user)
    res.render("index", { title: "Tableau de bord", page: "dashboard", user: req.session.user });
  else res.redirect("/login");
});

app.get("/reception", (req, res) => {
  if (req.session.user) res.render("reception");
});

app.get("/join-meeting", (req, res) => {
  if (req.session.user)
    res.render("index", { title: "Réunions", page: "join-meeting", user: req.session.user });
  else res.redirect("/login");
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

// Route pour afficher la page "Rejoindre une réunion"
app.get("/join-meeting", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login"); // Redirige vers la page de connexion si l'utilisateur n'est pas connecté
  }

  // Rendre la page "join-meeting" avec les informations de l'utilisateur
  res.render("index", { title: "Rejoindre une réunion", page: "join-meeting", user: req.session.user });
});




// Lancer le serveur sur un port aléatoire
const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});
