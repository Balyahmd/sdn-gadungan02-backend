import db from '../config/db.js';
import bcrypt from 'bcrypt';

class User {
    static async getAll() {
        const result = await db.query('SELECT id, username, email, role FROM tb_users');
        return result.rows;
    }

    static async create({ username, password, email, role = 'admin' }) {
        // Trim all inputs to prevent whitespace issues
        username = username.trim();
        password = password.trim();
        email = email.trim();

        console.log('Original password:', `"${password}"`); // Show exact input
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Hashed password:', `"${hashedPassword}"`); // Show exact hash

        const result = await db.query(
            'INSERT INTO tb_users (username, password, email, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, hashedPassword.trim(), email, role] // Trim hash before storing
        );
        return result.rows[0];
    }

    static async update(id, data) {
        const { username, email, password, role } = data;

        const query = {
            text: `UPDATE tb_users 
                   SET username = $1, email = $2, role = $3 
                   ${password ? ', password = $5' : ''}
                   WHERE id = $4
                   RETURNING id, username, email, role`,
            values: [username, email, role, id]
        };

        if (password) {
            query.values.push(password);
        }

        const result = await db.query(query);
        return result.rows[0];
    }

    static async delete(id) {
        await db.query('DELETE FROM tb_users WHERE id = $1', [id]);
    }

    static async findById(id) {
        const result = await db.query('SELECT id FROM tb_users WHERE id = $1', [id]);
        return result.rows[0];
    }

    // models/User.js
    static async findByUsernameOrEmail(identifier) {
        try {
            const result = await db.query(
                `SELECT * FROM tb_users 
             WHERE username = $1 OR email = $1 
             LIMIT 1`,
                [identifier.trim()] // Trim the identifier
            );

            if (!result.rows[0]) {
                console.log('No user found with identifier:', identifier);
                return null;
            }

            return result.rows[0];
        } catch (err) {
            console.error('Database query error:', err);
            throw err;
        }
    }

    static async isEmailUsedByOtherUser(email, id) {

        try {
            const result = await db.query(
                'SELECT id FROM tb_users WHERE email = $1 AND id != $2',
                [email.trim(), id]
            );
            return result.rows.length > 0;
        } catch (err) {
            console.error('Database query error:', err);
            throw err;
        }
    }

    static async comparePassword(candidatePassword, hashedPassword) {
        try {
            // Trim both inputs
            candidatePassword = candidatePassword.trim();
            hashedPassword = hashedPassword.trim();

            console.log('Comparing:', {
                candidateLength: candidatePassword.length,
                hashLength: hashedPassword.length,
                hashStartsWith: hashedPassword.substring(0, 10) + '...'
            });

            const match = await bcrypt.compare(candidatePassword, hashedPassword);
            console.log('Match result:', match);
            return match;
        } catch (err) {
            console.error('Comparison error:', err);
            return false;
        }
    }
}

export default User;