const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifierToken, autoriser } = require('../middleware/auth');

// Lister tous les livreurs disponibles
router.get('/', verifierToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT l.id, u.nom, u.prenom, u.telephone, l.vehicule, l.disponible 
             FROM livreurs l 
             JOIN utilisateurs u ON l.utilisateur_id = u.id
             ORDER BY l.id DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Changer la disponibilité d'un livreur (le livreur concerné ou un admin uniquement)
router.put('/:id/disponibilite', verifierToken, autoriser('admin', 'livreur'), async (req, res) => {
    const { id } = req.params;
    const { disponible } = req.body;

    if (req.utilisateur.role === 'livreur' && req.utilisateur.livreur_id !== parseInt(id, 10)) {
        return res.status(403).json({ erreur: 'Accès refusé' });
    }

    try {
        const result = await pool.query(
            'UPDATE livreurs SET disponible = $1 WHERE id = $2 RETURNING *',
            [disponible, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;