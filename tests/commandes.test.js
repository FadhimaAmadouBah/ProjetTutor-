require('./_env');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../index');
const pool = require('../db');
const { inscrire, connecter } = require('./helpers');

after(() => pool.end());

test('GET /api/commandes sans token → 401', async () => {
    const reponse = await request(app).get('/api/commandes');
    assert.equal(reponse.status, 401);
});

test('un client ne peut pas falsifier son client_id', async () => {
    const { email } = await inscrire(app, { role: 'client' });
    const { utilisateur, token } = await connecter(app, email);

    const reponse = await request(app)
        .post('/api/commandes')
        .set('Authorization', `Bearer ${token}`)
        .send({ client_id: 999999, adresse_depart: 'A', adresse_arrivee: 'B', type_vehicule: 'MOTO', poids_colis: 1, distance_km: 2 });

    assert.equal(reponse.status, 201);
    assert.equal(reponse.body.client_id, utilisateur.id);
});

test('un client ne voit que ses propres commandes', async () => {
    const clientA = await inscrire(app, { role: 'client' });
    const connexionA = await connecter(app, clientA.email);
    const clientB = await inscrire(app, { role: 'client' });
    const connexionB = await connecter(app, clientB.email);

    await request(app).post('/api/commandes').set('Authorization', `Bearer ${connexionA.token}`)
        .send({ adresse_depart: 'A', adresse_arrivee: 'B', type_vehicule: 'MOTO', poids_colis: 1, distance_km: 2 });

    const reponse = await request(app).get('/api/commandes').set('Authorization', `Bearer ${connexionB.token}`);
    assert.ok(reponse.body.every((c) => c.client_id === connexionB.utilisateur.id));
});
