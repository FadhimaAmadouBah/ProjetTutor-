const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifierToken, autoriser } = require('../middleware/auth');
const { creerNotification } = require('../services/notifications');

// Affecter un livreur a une commande (creation d'une livraison)
router.post('/', verifierToken, autoriser('admin'), async (req, res) => {
    const { commande_id, livreur_id } = req.body;
    try {
        // Creer la livraison
        const result = await pool.query(
            `INSERT INTO livraisons (commande_id, livreur_id, statut, date_debut)
             VALUES ($1, $2, 'ASSIGNEE', NOW()) RETURNING *`,
            [commande_id, livreur_id]
        );

        // Mettre a jour le statut de la commande
        const commande = await pool.query(
            `UPDATE commandes SET statut = 'CONFIRMEE' WHERE id = $1 RETURNING client_id`,
            [commande_id]
        );

        // Rendre le livreur indisponible
        const livreur = await pool.query(
            `UPDATE livreurs SET disponible = false WHERE id = $1 RETURNING utilisateur_id`,
            [livreur_id]
        );

        const livraison = result.rows[0];
        await Promise.all([
            creerNotification(commande.rows[0].client_id, `Un livreur a été affecté à votre commande #${commande_id}`),
            creerNotification(livreur.rows[0].utilisateur_id, `Vous avez été affecté à la livraison #${livraison.id}`),
        ]);

        res.status(201).json(livraison);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Lister les livraisons (filtrées selon le rôle : client → les siennes, livreur → les siennes, admin → tout)
router.get('/', verifierToken, async (req, res) => {
    try {
        const base = `SELECT l.*, c.client_id, c.adresse_depart, c.adresse_arrivee, u.nom, u.prenom
             FROM livraisons l
             JOIN commandes c ON l.commande_id = c.id
             JOIN livreurs liv ON l.livreur_id = liv.id
             JOIN utilisateurs u ON liv.utilisateur_id = u.id`;

        let result;
        if (req.utilisateur.role === 'client') {
            result = await pool.query(`${base} WHERE c.client_id = $1 ORDER BY l.created_at DESC`, [req.utilisateur.id]);
        } else if (req.utilisateur.role === 'livreur') {
            result = await pool.query(`${base} WHERE l.livreur_id = $1 ORDER BY l.created_at DESC`, [req.utilisateur.livreur_id]);
        } else {
            result = await pool.query(`${base} ORDER BY l.created_at DESC`);
        }
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Mettre a jour le statut d'une livraison (l'admin ou le livreur assigné uniquement)
router.put('/:id/statut', verifierToken, autoriser('admin', 'livreur'), async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body;
    try {
        const result = req.utilisateur.role === 'livreur'
            ? await pool.query(
                'UPDATE livraisons SET statut = $1 WHERE id = $2 AND livreur_id = $3 RETURNING *',
                [statut, id, req.utilisateur.livreur_id]
            )
            : await pool.query('UPDATE livraisons SET statut = $1 WHERE id = $2 RETURNING *', [statut, id]);

        if (result.rows.length === 0) {
            return res.status(403).json({ erreur: 'Livraison introuvable ou non assignée à ce livreur' });
        }

        const livraison = result.rows[0];
        const commande = await pool.query('SELECT client_id FROM commandes WHERE id = $1', [livraison.commande_id]);
        if (commande.rows.length > 0) {
            await creerNotification(commande.rows[0].client_id, `Votre livraison #${livraison.id} est maintenant : ${statut}`);
        }

        res.json(livraison);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Recuperer l'historique des positions d'une livraison
router.get('/:id/positions', verifierToken, async (req, res) => {
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