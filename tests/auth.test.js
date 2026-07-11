require('./_env');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../index');
const pool = require('../db');
const { inscrire, connecter } = require('./helpers');

after(() => pool.end());

test('inscription + connexion client', async () => {
    const { email } = await inscrire(app, { role: 'client' });
    const { utilisateur, token } = await connecter(app, email);

    assert.equal(utilisateur.role, 'client');
    assert.equal(utilisateur.livreur_id, null);
    assert.ok(token);
});

test('inscription livreur crée automatiquement son profil livreur', async () => {
    const { email } = await inscrire(app, { role: 'livreur', vehicule: 'MOTO' });
    const { utilisateur } = await connecter(app, email);

    assert.equal(utilisateur.role, 'livreur');
    assert.ok(utilisateur.livreur_id, 'livreur_id doit être défini');
});

test('mauvais mot de passe → 401', async () => {
    const { email } = await inscrire(app, { role: 'client' });
    const reponse = await request(app).post('/api/utilisateurs/connexion').send({ email, mot_de_passe: 'faux' });
    assert.equal(reponse.status, 401);
});
