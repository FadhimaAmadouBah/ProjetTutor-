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
Créer un fichier appelé .env à la racine du projet et coller ceci :

PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=livraison_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe_postgres

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

## Les API disponibles

### Utilisateurs
POST   /api/utilisateurs/inscription   → créer un compte
POST   /api/utilisateurs/connexion     → se connecter

### Commandes
POST   /api/commandes                  → créer une commande
GET    /api/commandes                  → voir toutes les commandes
PUT    /api/commandes/:id/statut       → changer le statut

### Livraisons
POST   /api/livraisons                 → affecter un livreur
GET    /api/livraisons                 → voir toutes les livraisons
PUT    /api/livraisons/:id/statut      → changer le statut
GET    /api/livraisons/:id/positions   → historique GPS

### Livreurs
GET    /api/livreurs                   → voir les livreurs
PUT    /api/livreurs/:id/disponibilite → changer la disponibilité

---

## Suivi GPS en temps réel avec Socket.io

Le serveur Socket.io tourne sur le même port que l'API (3000).

### 1. Se connecter au serveur
const socket = io("http://localhost:3000");

### 2. Rejoindre une livraison
Obligatoire avant de recevoir les positions de cette livraison.
socket.emit('rejoindre_livraison', livraisonId);

### 3. Envoyer une position GPS (application mobile du livreur)
socket.emit('position_gps', {
    livraison_id: 1,
    livreur_id: 1,
    latitude: 14.6928,
    longitude: -17.4467
});

### 4. Recevoir une position GPS (application client)
socket.on('position_mise_a_jour', (data) => {
    // Utiliser data.latitude et data.longitude
    // pour afficher sur la carte OpenStreetMap
});

---

## Calcul automatique du prix

Le prix est calculé automatiquement quand une commande est créée.
Formule : prix_base + (distance_km x tarif_km) + (poids_colis x tarif_kg)

Exemple avec une MOTO, 5km, 2kg :
800 + (5 x 150) + (2 x 75) = 1700 FCFA

Les tarifs sont stockés dans la table tarifs de la base de données.