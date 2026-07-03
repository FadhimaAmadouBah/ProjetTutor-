const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

// Inscription
router.post('/inscription', async (req, res) => {
    const { nom, prenom, email, mot_de_passe, role, telephone } = req.body;
    try {
        // On crypte le mot de passe avant de l'enregistrer
        const mot_de_passe_crypte = await bcrypt.hash(mot_de_passe, 10);

        const result = await pool.query(
            `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, telephone) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nom, prenom, email, role, telephone, created_at`,
            [nom, prenom, email, mot_de_passe_crypte, role, telephone]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

// Connexion
router.post('/connexion', async (req, res) => {
    const { email, mot_de_passe } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM utilisateurs WHERE email = $1',
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

        res.json({ message: 'Connexion réussie ✅', utilisateur });
    } catch (err) {
        res.status(500).json({ erreur: err.message });
    }
});

module.exports = router;