require('./_env');
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { app } = require('../index');
const pool = require('../db');
const { inscrire, connecter } = require('./helpers');

after(() => pool.end());

async function creerCommandeEtAffecter(app) {
    const client = await inscrire(app, { role: 'client' });
    const connexionClient = await connecter(app, client.email);

    const commande = await request(app).post('/api/commandes').set('Authorization', `Bearer ${connexionClient.token}`)
        .send({ adresse_depart: 'A', adresse_arrivee: 'B', type_vehicule: 'MOTO', poids_colis: 1, distance_km: 2 });

    const livreur = await inscrire(app, { role: 'livreur', vehicule: 'MOTO' });
    const connexionLivreur = await connecter(app, livreur.email);

    const admin = await inscrire(app, { role: 'admin' });
    const connexionAdmin = await connecter(app, admin.email);

    await request(app).post('/api/livraisons').set('Authorization', `Bearer ${connexionAdmin.token}`)
        .send({ commande_id: commande.body.id, livreur_id: connexionLivreur.utilisateur.livreur_id });

    return { connexionClient, connexionLivreur };
}

test('une notification est créée pour le client et le livreur lors de l\'affectation', async () => {
    const { connexionClient, connexionLivreur } = await creerCommandeEtAffecter(app);

    const notifsClient = await request(app).get('/api/notifications').set('Authorization', `Bearer ${connexionClient.token}`);
    assert.ok(notifsClient.body.some((n) => n.message.includes('affecté')));

    const notifsLivreur = await request(app).get('/api/notifications').set('Authorization', `Bearer ${connexionLivreur.token}`);
    assert.ok(notifsLivreur.body.some((n) => n.message.includes('affecté')));
});

test('marquer sa propre notification comme lue', async () => {
    const { connexionClient } = await creerCommandeEtAffecter(app);

    const notifs = await request(app).get('/api/notifications').set('Authorization', `Bearer ${connexionClient.token}`);
    const notif = notifs.body[0];

    const reponse = await request(app).put(`/api/notifications/${notif.id}/lu`).set('Authorization', `Bearer ${connexionClient.token}`);
    assert.equal(reponse.status, 200);
    assert.equal(reponse.body.lu, true);
});

test("un utilisateur ne peut pas marquer la notification d'un autre comme lue", async () => {
    const { connexionClient } = await creerCommandeEtAffecter(app);
    const notifs = await request(app).get('/api/notifications').set('Authorization', `Bearer ${connexionClient.token}`);
    const notif = notifs.body[0];

    const autreClient = await inscrire(app, { role: 'client' });
    const connexionAutreClient = await connecter(app, autreClient.email);

    const reponse = await request(app).put(`/api/notifications/${notif.id}/lu`).set('Authorization', `Bearer ${connexionAutreClient.token}`);
    assert.equal(reponse.status, 404);
});
