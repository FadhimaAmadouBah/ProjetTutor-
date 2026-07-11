const pool = require('../db');

async function creerNotification(utilisateur_id, message) {
    await pool.query(
        'INSERT INTO notifications (utilisateur_id, message) VALUES ($1, $2)',
        [utilisateur_id, message]
    );
}

module.exports = { creerNotification };
