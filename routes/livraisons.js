const express = require('express');
const router = express.Router();
const pool = require('../db');

// Affecter un livreur a une commande (creation d'une livraison)
router.post('/', async (req, res) => {
    const { commande_id, livreur_id } = req.body;
    try {
        // Creer la livraison
        const result = await pool.query(
            `INSERT INTO livraisons (commande_id, livreur_id, statut, date_debut) 
             VALUES ($1, $2, 'ASSIGNEE', NOW()) RETURNING *`,
            [commande_id, livreur_id]
        );

        // Mettre a jour le statut de la commande
        await pool.query(
            `UPDATE commandes SET statut = 'CONFIRMEE' WHERE id = $1`,
            [commande_id]
        );

        // Rendre le livreur indisponible
        await pool.query(
            `UPDATE livreurs SET disponible = false WHERE id = $1`,
            [livreur_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Lister toutes les livraisons
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT l.*, c.adresse_depart, c.adresse_arrivee, u.nom, u.prenom
             FROM livraisons l
             JOIN commandes c ON l.commande_id = c.id
             JOIN livreurs liv ON l.livreur_id = liv.id
             JOIN utilisateurs u ON liv.utilisateur_id = u.id
             ORDER BY l.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Mettre a jour le statut d'une livraison
router.put('/:id/statut', async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;
    try {
        const result = await pool.query(
            'UPDATE livraisons SET statut = $1 WHERE id = $2 RETURNING *',
            [statut, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Recuperer l'historique des positions d'une livraison
router.get('/:id/positions', async (req, res) => {
    const { id } = req.params;
    try {
        const livraisonResult = await pool.query(
            'SELECT livreur_id FROM livraisons WHERE id = $1',
            [id]
        );

        if (livraisonResult.rows.length === 0) {
            return res.status(404).json({ erreur: 'Livraison introuvable' });
        }

        const livreurId = livraisonResult.rows[0].livreur_id;

        const positionsResult = await pool.query(
            'SELECT * FROM positions WHERE livreur_id = $1 ORDER BY created_at DESC LIMIT 50',
            [livreurId]
        );

        res.json(positionsResult.rows);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;