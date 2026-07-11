const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Inscription
router.post('/inscription', async (req, res) => {
    const { nom, prenom, email, mot_de_passe, role, telephone, vehicule } = req.body;
    try {
        // On crypte le mot de passe avant de l'enregistrer
        const mot_de_passe_crypte = await bcrypt.hash(mot_de_passe, 10);

        const result = await pool.query(
            `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, telephone)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nom, prenom, email, role, telephone, created_at`,
            [nom, prenom, email, mot_de_passe_crypte, role, telephone]
        );

        const utilisateur = result.rows[0];

        // Un livreur a besoin d'un profil dans la table livreurs pour recevoir des livraisons
        if (role === 'livreur') {
            await pool.query(
                `INSERT INTO livreurs (utilisateur_id, vehicule) VALUES ($1, $2)`,
                [utilisateur.id, vehicule || null]
            );
        }

        res.status(201).json(utilisateur);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Connexion
router.post('/connexion', async (req, res) => {
    const { email, mot_de_passe } = req.body;
    try {
        const result = await pool.query(
            `SELECT u.*, l.id AS livreur_id
             FROM utilisateurs u
             LEFT JOIN livreurs l ON l.utilisateur_id = u.id
             WHERE u.email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
        }

        const utilisateur = result.rows[0];

        // On compare le mot de passe envoyé avec celui crypté en base
        const motDePasseValide = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);

        if (!motDePasseValide) {
            return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
        }

        // On ne renvoie jamais le mot de passe dans la réponse
        delete utilisateur.mot_de_passe;

        const token = jwt.sign(
            { id: utilisateur.id, role: utilisateur.role, livreur_id: utilisateur.livreur_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ message: 'Connexion réussie ✅', utilisateur, token });
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;