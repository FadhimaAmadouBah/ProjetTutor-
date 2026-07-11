const request = require('supertest');
const { randomUUID } = require('crypto');

function emailUnique(prefix) {
    return `${prefix}-${randomUUID()}@test.local`;
}

async function inscrire(app, { role = 'client', vehicule } = {}) {
    const email = emailUnique(role);
    await request(app).post('/api/utilisateurs/inscription').send({
        nom: 'Test',
        prenom: role,
        email,
        mot_de_passe: 'motdepasse123',
        role,
        telephone: '770000000',
        vehicule,
    });
    return { email };
}

async function connecter(app, email, mot_de_passe = 'motdepasse123') {
    const reponse = await request(app).post('/api/utilisateurs/connexion').send({ email, mot_de_passe });
    return reponse.body; // { utilisateur, token }
}

module.exports = { inscrire, connecter, emailUnique };
