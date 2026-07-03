const express = require('express');
const router = express.Router();
const pool = require('../db');

// Créer une commande (avec calcul automatique du prix)
router.post('/', async (req, res) => {
    const { client_id, adresse_depart, adresse_arrivee, type_vehicule, poids_colis, distance_km } = req.body;
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

// Lister toutes les commandes
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM commandes ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Confirmer ou annuler une commande
router.put('/:id/statut', async (req, res) => {
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