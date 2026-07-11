# Plateforme de Livraison en Temps Réel — Backend

---

## Utilite de chaque fichier

**index.js**
C'est le fichier principal qui démarre le serveur.
C'est lui qui reçoit toutes les requêtes et les redirige vers le bon fichier route.
Il contient aussi la configuration Socket.io pour le temps réel.

**db.js**
C'est le fichier qui connecte le serveur à la base de données PostgreSQL.
Tous les autres fichiers l'utilisent pour communiquer avec la base de données.

**database.sql**
C'est le fichier qui contient toutes les instructions pour créer la base de données.
Il suffit de l'exécuter dans pgAdmin pour avoir exactement la même structure.

**routes/commandes.js**
Gère tout ce qui concerne les commandes :
créer une commande, voir les commandes, changer le statut.
Le prix est calculé automatiquement selon le véhicule, la distance et le poids.

**routes/livraisons.js**
Gère tout ce qui concerne les livraisons :
affecter un livreur à une commande, voir les livraisons,
changer le statut, voir l'historique GPS.

**routes/livreurs.js**
Gère les livreurs :
voir les livreurs disponibles, changer la disponibilité.

**routes/utilisateurs.js**
Gère les comptes :
créer un compte (mot de passe crypté automatiquement), se connecter.

**.env**
Contient les informations de connexion à la base de données.
Ce fichier n'est pas sur GitHub pour des raisons de sécurité.
Chaque membre doit créer le sien sur sa machine.

**package.json**
Contient la liste de tous les packages utilisés.
Quand vous faites npm install, il installe tout automatiquement.

---

## Comment installer et lancer le projet

### Etape 1 : Cloner le projet
git clone https://github.com/FadhimaAmadouBah/ProjetTutor-.git
cd livraison-app

### Etape 2 : Installer les packages
npm install

### Etape 3 : Créer le fichier .env
Copier .env.example vers .env et remplacer les valeurs :

PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=livraison_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres
JWT_SECRET=une_longue_chaine_aleatoire_a_generer

### Etape 4 : Créer la base de données
- Ouvrir pgAdmin
- Créer une base de données appelée livraison_db
- Ouvrir le Query Tool
- Coller le contenu du fichier database.sql
- Exécuter avec le bouton play
- Toutes les tables sont créées automatiquement

### Etape 5 : Démarrer le serveur
node index.js

Le serveur tourne sur http://localhost:3000
Vous devez voir ces deux messages :
Serveur demarre sur le port 3000
Connecte a PostgreSQL

---

## Authentification

La connexion renvoie un token JWT. Toutes les routes ci-dessous (sauf inscription/connexion)
attendent l'en-tête :
Authorization: Bearer <token>

Chaque route vérifie aussi le rôle de l'utilisateur (client / livreur / admin) et refuse
les actions qui ne le concernent pas (ex : un client ne peut pas affecter un livreur).

## Les API disponibles

### Utilisateurs
POST   /api/utilisateurs/inscription   → créer un compte (public)
POST   /api/utilisateurs/connexion     → se connecter, renvoie { utilisateur, token } (public)

### Commandes
POST   /api/commandes                  → créer une commande (client, admin)
GET    /api/commandes                  → voir ses commandes (client) ou toutes (admin)
PUT    /api/commandes/:id/statut       → changer le statut (admin)

### Livraisons
POST   /api/livraisons                 → affecter un livreur (admin)
GET    /api/livraisons                 → voir ses livraisons (client/livreur) ou toutes (admin)
PUT    /api/livraisons/:id/statut      → changer le statut (admin, ou le livreur assigné)
GET    /api/livraisons/:id/positions   → historique GPS (authentifié)

### Livreurs
GET    /api/livreurs                   → voir les livreurs (authentifié)
PUT    /api/livreurs/:id/disponibilite → changer la disponibilité (admin, ou le livreur concerné)

### Notifications
GET    /api/notifications              → voir mes notifications (authentifié)
PUT    /api/notifications/:id/lu       → marquer une notification comme lue (le destinataire uniquement)

Une notification est créée automatiquement quand un livreur est affecté (client + livreur)
et quand le statut d'une livraison change (client).

---

## Suivi GPS en temps réel avec Socket.io

Le serveur Socket.io tourne sur le même port que l'API (3000).
La connexion nécessite le même token JWT que les routes REST.

### 1. Se connecter au serveur
const socket = io("http://localhost:3000", { auth: { token } });

### 2. Rejoindre une livraison
Obligatoire avant de recevoir les positions de cette livraison.
socket.emit('rejoindre_livraison', livraisonId);

### 3. Envoyer une position GPS (le livreur connecté)
socket.emit('position_gps', {
    livraison_id: 1,
    latitude: 14.6928,
    longitude: -17.4467
});
Le livreur_id vient du token, pas du message envoyé (impossible d'usurper un autre livreur).

### 4. Recevoir une position GPS (application client)
socket.on('position_mise_a_jour', (data) => {
    // Utiliser data.latitude et data.longitude
    // pour afficher sur la carte OpenStreetMap
});

---

## Frontend

Un frontend React (Vite) se trouve dans frontend/. Pour le lancer :

cd frontend
npm install
npm run dev

Il tourne sur http://localhost:5173 et attend le backend sur http://localhost:3000.

---

## Tests

npm test

Lance la suite de tests automatisés (node --test) contre une base de données séparée
livraison_db_test. Avant la première exécution, créer cette base et y charger le schéma :

createdb livraison_db_test
psql -d livraison_db_test -f database.sql

Puis créer un fichier .env.test (mêmes variables que .env, avec DB_NAME=livraison_db_test).

---

## Calcul automatique du prix

Le prix est calculé automatiquement quand une commande est créée.
Formule : prix_base + (distance_km x tarif_km) + (poids_colis x tarif_kg)

Exemple avec une MOTO, 5km, 2kg :
800 + (5 x 150) + (2 x 75) = 1700 FCFA

Les tarifs sont stockés dans la table tarifs de la base de données.