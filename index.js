const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('./db');
const commandesRoutes = require('./routes/commandes');
const livreursRoutes = require('./routes/livreurs');
const utilisateursRoutes = require('./routes/utilisateurs');
const livraisonsRoutes = require('./routes/livraisons');
const notificationsRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/api/commandes', commandesRoutes);
app.use('/api/livreurs', livreursRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/livraisons', livraisonsRoutes);
app.use('/api/notifications', notificationsRoutes);

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'Serveur livraison operationnel' });
});

// Authentification des sockets : un token JWT valide est obligatoire pour se connecter
io.use((socket, next) => {
    try {
        socket.utilisateur = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        next(new Error('Authentification requise'));
    }
});

io.on('connection', (socket) => {
    console.log('Un utilisateur connecte :', socket.id);

    // Le livreur rejoint une "room" liee a sa livraison
    socket.on('rejoindre_livraison', (livraisonId) => {
        socket.join(`livraison_${livraisonId}`);
        console.log(`Socket ${socket.id} a rejoint la livraison ${livraisonId}`);
    });

    // Reception d'une position GPS liee a une livraison precise
    socket.on('position_gps', async (data) => {
        // Le livreur_id vient du token, jamais du client : impossible d'usurper un autre livreur
        if (socket.utilisateur.role !== 'livreur') return;
        const livreur_id = socket.utilisateur.livreur_id;
        const { livraison_id, latitude, longitude } = data;
        console.log('Position recue pour livraison', livraison_id, ':', latitude, longitude);

        try {
            // 1. Sauvegarder la position en base de donnees
            await pool.query(
                'INSERT INTO positions (livreur_id, latitude, longitude) VALUES ($1, $2, $3)',
                [livreur_id, latitude, longitude]
            );

            // 2. Envoyer la position uniquement aux personnes qui suivent CETTE livraison
            io.to(`livraison_${livraison_id}`).emit('position_mise_a_jour', {
                livraison_id,
                latitude,
                longitude
            });
        } catch (err) {
            console.error('Erreur sauvegarde position :', err.message);
        }
    });

    socket.on('disconnect', () => {
        console.log('Utilisateur deconnecte :', socket.id);
    });
});
// Demarrage du serveur (sauf quand ce fichier est importé, ex. par les tests)
const PORT = process.env.PORT || 3000;
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`Serveur demarre sur le port ${PORT}`);
    });
}

module.exports = { app, server, io };