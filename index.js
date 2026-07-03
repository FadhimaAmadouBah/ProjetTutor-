const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const commandesRoutes = require('./routes/commandes');
const livreursRoutes = require('./routes/livreurs');
const utilisateursRoutes = require('./routes/utilisateurs');
const livraisonsRoutes = require('./routes/livraisons');

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

// Route de test
app.get('/', (req, res) => {
    res.json({ message: 'Serveur livraison operationnel' });
});

// Socket.io
io.on('connection', (socket) => {
    console.log('Un utilisateur connecte :', socket.id);

    // Le livreur rejoint une "room" liee a sa livraison
    socket.on('rejoindre_livraison', (livraisonId) => {
        socket.join(`livraison_${livraisonId}`);
        console.log(`Socket ${socket.id} a rejoint la livraison ${livraisonId}`);
    });

    // Reception d'une position GPS liee a une livraison precise
    socket.on('position_gps', async (data) => {
        const { livraison_id, livreur_id, latitude, longitude } = data;
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
// Demarrage du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur demarre sur le port ${PORT}`);
});