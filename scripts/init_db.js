const fs = require("fs");
const { Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

// Créer une nouvelle instance du client PostgreSQL
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

client.connect()
    .then(() => {
        console.log("Connexion réussie à la base de données.");

        // Lire le fichier SQL
        const sql = fs.readFileSync("./scripts/init_db.sql", "utf8");

        console.log("Fichier SQL chargé.");

        // exécuter le fichier SQL
        return client.query(sql);
    })
    .then(() => {
        console.log("Base de données initialisée avec succès !");
    })
    .catch(err => {
        console.error("Erreur lors de l'initialisation de la base de données", err);
    })
    .finally(() => {
        client.end();
    });
