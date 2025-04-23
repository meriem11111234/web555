-- Supprimer les tables si elles existent (dans le bon ordre à cause des clés étrangères)
DROP TABLE IF EXISTS pending_invitations CASCADE;
DROP TABLE IF EXISTS slot_responses CASCADE;
DROP TABLE IF EXISTS availabilities CASCADE;
DROP TABLE IF EXISTS meeting_slots CASCADE;
DROP TABLE IF EXISTS meeting_participants CASCADE;
DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS users CASCADE;


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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter la colonne code uniquement si elle n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns 
        WHERE table_name='meetings' AND column_name='code'
    ) THEN
        ALTER TABLE meetings
        ADD COLUMN code VARCHAR(10) UNIQUE;
    END IF;
END$$;

-- Créer la table des participants aux réunions
CREATE TABLE IF NOT EXISTS meeting_participants (
    id SERIAL PRIMARY KEY,
    meeting_id INTEGER REFERENCES meetings(id),
    user_id INTEGER REFERENCES users(id),
    response VARCHAR(50) -- Peut être "accepte", "refuse", ou "en attente"
);

CREATE TABLE availabilities (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL
);

CREATE TABLE meeting_slots (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER REFERENCES meetings(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL
);

CREATE TABLE slot_responses (
  id SERIAL PRIMARY KEY,
  slot_id INTEGER REFERENCES meeting_slots(id),
  user_id INTEGER REFERENCES users(id),
  response TEXT,
  UNIQUE(slot_id, user_id)
);


CREATE TABLE pending_invitations (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER REFERENCES meetings(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);