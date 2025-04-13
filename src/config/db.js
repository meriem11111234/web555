const { Pool } = require("pg");
require("dotenv").config();

// Configuration de la connexion PostgreSQL : pour une connexion sécurisée et chiffrée entre App.js et la base de donnée
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ?  //Si je suis en ligne , sur internet 
    { rejectUnauthorized: false } : false
});

// Vérifier la connexion
pool.connect()
    .then(() => console.log("✅ Connecté à PostgreSQL"))
    .catch(err => console.error("❌ Erreur de connexion à la base de données :", err));

module.exports = pool;
