const express = require("express");
const pool = require("../config/db");  // Assure-toi que la connexion à PostgreSQL fonctionne bien
const router = express.Router();

// Route d'inscription
router.post("/register", async (req, res) => {
    const { email, password, role } = req.body;

    console.log("Données reçues pour l'inscription :", req.body);  // Log des données pour déboguer

    // Vérification des données
    if (!email || !password || !role) {
        return res.status(400).render("index", { 
            page: 'register', // Passer la variable page avec 'register'
            error: "Tous les champs sont requis !" 
        });
    }

    try {
        // Vérifier si l'email est déjà utilisé
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length > 0) {
            return res.status(400).render("index", { 
                page: 'register', // Passer la variable page avec 'register'
                error: "Cet email est déjà utilisé !" 
            });
        }

        // ne pas Hasher le mot de passe
        const plainPassword = password;

        // Enregistrer l'utilisateur dans la base de données
        const newUser = await pool.query(
            "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *",
            [email, plainPassword, role]
        );

        console.log("Utilisateur créé avec mot de passe en clair :", newUser.rows[0]);

        // Envoyer la réponse
        res.status(201).redirect("/login");  // Redirection vers la page de connexion après l'inscription

    } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        res.status(500).render("index", { 
            page: 'register', // Passer la variable page avec 'register'
            error: "Erreur interne du serveur !" 
        });
    }
});

// Route de connexion
// Route de connexion
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        console.log("Tentative de connexion pour l'email :", email);  // Afficher l'email pour déboguer
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            console.log("Aucun utilisateur trouvé pour cet email.");  // Log si l'utilisateur n'existe pas
            return res.status(400).render("index", { 
                page: 'login',
                error: "Utilisateur non trouvé" 
            });
        }

        const user = result.rows[0];

        // Comparer directement le mot de passe en clair saisi avec le mot de passe en clair stocké
        console.log("Mot de passe stocké en clair dans la base de données :", user.password);

        if (password !== user.password) {
            return res.status(400).render("index", { 
                page: 'login', 
                error: "Mot de passe incorrect" 
            });
        }

        // Ajouter l'utilisateur à la session
        req.session.user = user;
        res.redirect("/dashboard");

    } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        res.status(500).render("index", { 
            page: 'login', 
            error: "Erreur interne du serveur" 
        });
    }
});



// Route pour le tableau de bord
router.get("/dashboard", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    res.render("index", { 
        page: 'dashboard', // Passer la variable page avec 'dashboard'
        user: req.session.user
    });
});

// Route de déconnexion
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

module.exports = router;
