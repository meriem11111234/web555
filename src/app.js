require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./config/db");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
    res.send("Bienvenue sur la plateforme de planification de réunions !");
});

// Lancer le serveur sur un port aléatoire
const server = app.listen(0, () => { 
    const port = server.address().port;
    console.log(`✅ Serveur démarré sur http://localhost:${port}`);
});
