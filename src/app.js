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
const availabilityRoutes = require("./routes/availabilityRoutes");
app.use("/availabilities", availabilityRoutes);
const slotResponseRoutes = require("./routes/slotResponseRoutes");
app.use("/api/slot-response", slotResponseRoutes);
app.get("/ajouter-disponibilite", async (req, res) => {

  try {
    const user_id = req.session.user.id;

    const meetingsResult = await db.query(`
      SELECT meetings.id, meetings.title 
      FROM meetings 
      JOIN meeting_participants ON meetings.id = meeting_participants.meeting_id 
      WHERE meeting_participants.user_id = $1
    `, [user_id]);

    const availabilitiesResult = await db.query(`
      SELECT * FROM availabilities WHERE user_id = $1
    `, [user_id]);

    res.render("index", {
      page: "ajouter-disponibilite",
      user: req.session.user,
      meetings: meetingsResult.rows,
      availabilities: availabilitiesResult.rows 
    });

  } catch (error) {
    console.error("Erreur :", error);
    res.status(500).send("Erreur serveur");
  }
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

const { getMeetingDetails } = require("./controllers/meetingController");

app.get("/meeting/code/:code", getMeetingDetails);


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




const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  const baseUrl = `http://localhost:${PORT}`;
  app.locals.baseUrl = baseUrl; 
  console.log(`✅ Serveur démarré sur ${baseUrl}`);
});

