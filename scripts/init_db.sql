DROP IF EXISTS users;
DROP IF EXISTS meetings;
DROP IF EXISTS meeting_participants;

-- Créer la table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    last_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table des réunions
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INTEGER REFERENCES users(id),
    code VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter la colonne code uniquement si elle n'existe pas déjà
ALTER TABLE meetings
ADD COLUMN IF NOT EXISTS code VARCHAR(10) UNIQUE;

-- Créer la table des participants aux réunions (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS meeting_participants (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id),
    user_id INTEGER REFERENCES users(id),
    response VARCHAR(50) -- Peut être "accepte", "refuse", ou "en attente"
);
