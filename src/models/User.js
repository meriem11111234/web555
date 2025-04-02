const pool = require("../config/db");

class User {
  // Méthode de création d'un utilisateur sans hachage du mot de passe
  static async createUser(lastName, firstName, email, password, role = "participant") {
    const query =
      "INSERT INTO users (last_name, first_name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const values = [lastName, firstName, email, password, role]; // Le mot de passe en texte clair est directement inséré
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Méthode pour trouver un utilisateur par email
  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }
}

module.exports = User;
