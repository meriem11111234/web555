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
        // Lire le fichier 
        const sql = fs.readFileSync("./scripts/init_db.sql", "utf8");

        // Exécuter le fichier SQL
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
