const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifierToken } = require('../middleware/auth');

// Lister mes notifications
router.get('/', verifierToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM notifications WHERE utilisateur_id = $1 ORDER BY created_at DESC',
            [req.utilisateur.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Marquer une notification comme lue (uniquement la sienne)
router.put('/:id/lu', verifierToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE notifications SET lu = true WHERE id = $1 AND utilisateur_id = $2 RETURNING *',
            [id, req.utilisateur.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Notification introuvable' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;
