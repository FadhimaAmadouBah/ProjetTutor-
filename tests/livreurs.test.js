require('./_env');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../index');
const pool = require('../db');
const { inscrire, connecter } = require('./helpers');

after(() => pool.end());

test("un livreur ne peut pas changer la disponibilité d'un autre livreur", async () => {
    const livreurA = await inscrire(app, { role: 'livreur', vehicule: 'MOTO' });
    const connexionA = await connecter(app, livreurA.email);
    const livreurB = await inscrire(app, { role: 'livreur', vehicule: 'VELO' });
    const connexionB = await connecter(app, livreurB.email);

    const reponse = await request(app).put(`/api/livreurs/${connexionB.utilisateur.livreur_id}/disponibilite`)
        .set('Authorization', `Bearer ${connexionA.token}`)
        .send({ disponible: false });

    assert.equal(reponse.status, 403);
});

test('un livreur peut changer sa propre disponibilité', async () => {
    const livreur = await inscrire(app, { role: 'livreur', vehicule: 'MOTO' });
    const connexion = await connecter(app, livreur.email);

    const reponse = await request(app).put(`/api/livreurs/${connexion.utilisateur.livreur_id}/disponibilite`)
        .set('Authorization', `Bearer ${connexion.token}`)
        .send({ disponible: false });

    assert.equal(reponse.status, 200);
    assert.equal(reponse.body.disponible, false);
});
