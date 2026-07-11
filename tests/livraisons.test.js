require('./_env');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../index');
const pool = require('../db');
const { inscrire, connecter } = require('./helpers');

after(() => pool.end());

async function creerCommandePourClient(app, token) {
    const reponse = await request(app).post('/api/commandes').set('Authorization', `Bearer ${token}`)
        .send({ adresse_depart: 'A', adresse_arrivee: 'B', type_vehicule: 'MOTO', poids_colis: 1, distance_km: 2 });
    return reponse.body;
}

test('un client ne peut pas affecter un livreur (403)', async () => {
    const client = await inscrire(app, { role: 'client' });
    const connexionClient = await connecter(app, client.email);
    const commande = await creerCommandePourClient(app, connexionClient.token);

    const livreur = await inscrire(app, { role: 'livreur', vehicule: 'MOTO' });
    const connexionLivreur = await connecter(app, livreur.email);

    const reponse = await request(app).post('/api/livraisons').set('Authorization', `Bearer ${connexionClient.token}`)
        .send({ commande_id: commande.id, livreur_id: connexionLivreur.utilisateur.livreur_id });

    assert.equal(reponse.status, 403);
});

test("l'admin peut affecter un livreur, et seul le livreur assigné peut modifier le statut", async () => {
    const client = await inscrire(app, { role: 'client' });
    const connexionClient = await connecter(app, client.email);
    const commande = await creerCommandePourClient(app, connexionClient.token);

    const livreur = await inscrire(app, { role: 'livreur', vehicule: 'MOTO' });
    const connexionLivreur = await connecter(app, livreur.email);

    const admin = await inscrire(app, { role: 'admin' });
    const connexionAdmin = await connecter(app, admin.email);

    const affectation = await request(app).post('/api/livraisons').set('Authorization', `Bearer ${connexionAdmin.token}`)
        .send({ commande_id: commande.id, livreur_id: connexionLivreur.utilisateur.livreur_id });
    assert.equal(affectation.status, 201);

    // un autre livreur ne peut pas modifier cette livraison
    const autreLivreur = await inscrire(app, { role: 'livreur', vehicule: 'VELO' });
    const connexionAutreLivreur = await connecter(app, autreLivreur.email);
    const tentative = await request(app).put(`/api/livraisons/${affectation.body.id}/statut`)
        .set('Authorization', `Bearer ${connexionAutreLivreur.token}`)
        .send({ statut: 'EN_TRANSIT' });
    assert.equal(tentative.status, 403);

    // le bon livreur peut la modifier
    const reponse = await request(app).put(`/api/livraisons/${affectation.body.id}/statut`)
        .set('Authorization', `Bearer ${connexionLivreur.token}`)
        .send({ statut: 'EN_TRANSIT' });
    assert.equal(reponse.status, 200);
    assert.equal(reponse.body.statut, 'EN_TRANSIT');
});
