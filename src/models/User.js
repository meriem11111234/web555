const pool = require("../config/db");

class User {
    static async createUser(email, password, role = "participant") {
        const hashedPassword = await require("bcryptjs").hash(password, 10);
        const query = "INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING *";
        const values = [email, hashedPassword, role];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = "SELECT * FROM users WHERE email = $1";
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }
}

module.exports = User;
