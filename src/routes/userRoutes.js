const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");  // Assure-toi que la connexion à PostgreSQL fonctionne bien
const router = express.Router();

// Route d'inscription
router.post("/register", async (req, res) => {
    const { email, password, role } = req.body;

    console.log("Données reçues pour l'inscription :", req.body);  // Log des données pour déboguer

    // Vérification des données
    if (!email || !password || !role) {
        return res.status(400).render("register", { error: "Tous les champs sont requis !" });
    }

    try {
        // Vérifier si l'email est déjà utilisé
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            return res.status(400).render("register", { error: "Cet email est déjà utilisé !" });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Enregistrer l'utilisateur dans la base de données
        const newUser = await pool.query(
            "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
            [email, hashedPassword, role]
        );
        
        // Créer un token JWT
        const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });

        // Envoyer la réponse
        res.status(201).redirect("/login");  // Redirection vers la page de connexion après l'inscription

    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        res.status(500).render("register", { error: "Erreur interne du serveur !" });
    }
});

module.exports = router;
