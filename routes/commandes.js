const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifierToken, autoriser } = require('../middleware/auth');

// Créer une commande (avec calcul automatique du prix)
router.post('/', verifierToken, autoriser('client', 'admin'), async (req, res) => {
    const { adresse_depart, adresse_arrivee, type_vehicule, poids_colis, distance_km } = req.body;
    // Un client ne peut créer une commande que pour lui-même
    const client_id = req.utilisateur.role === 'client' ? req.utilisateur.id : req.body.client_id;
    try {
        const tarifResult = await pool.query(
            'SELECT * FROM tarifs WHERE type_vehicule = $1',
            [type_vehicule]
        );

        if (tarifResult.rows.length === 0) {
            return res.status(400).json({ erreur: 'Type de vehicule invalide' });
        }

        const tarif = tarifResult.rows[0];

        const prix = parseFloat(tarif.prix_base)
                   + (parseFloat(distance_km) * parseFloat(tarif.tarif_km))
                   + (parseFloat(poids_colis) * parseFloat(tarif.tarif_kg));

        const result = await pool.query(
            `INSERT INTO commandes 
             (client_id, adresse_depart, adresse_arrivee, type_vehicule, poids_colis, distance_km, prix) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [client_id, adresse_depart, adresse_arrivee, type_vehicule, poids_colis, distance_km, prix.toFixed(2)]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Lister les commandes (un client ne voit que les siennes, l'admin voit tout)
router.get('/', verifierToken, autoriser('client', 'admin'), async (req, res) => {
    try {
        const result = req.utilisateur.role === 'client'
            ? await pool.query('SELECT * FROM commandes WHERE client_id = $1 ORDER BY created_at DESC', [req.utilisateur.id])
            : await pool.query('SELECT * FROM commandes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Confirmer ou annuler une commande
router.put('/:id/statut', verifierToken, autoriser('admin'), async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;
    try {
        const result = await pool.query(
            'UPDATE commandes SET statut = $1 WHERE id = $2 RETURNING *',
            [statut, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;