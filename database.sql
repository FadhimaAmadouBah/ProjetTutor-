

-- Table utilisateurs
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'livreur', 'admin')),
    telephone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table livreurs
CREATE TABLE livreurs (
    id SERIAL PRIMARY KEY,
    utilisateur_id INT REFERENCES utilisateurs(id),
    vehicule VARCHAR(50),
    disponible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table tarifs
CREATE TABLE tarifs (
    id SERIAL PRIMARY KEY,
    type_vehicule VARCHAR(20) UNIQUE NOT NULL CHECK (type_vehicule IN ('VELO', 'MOTO', 'VOITURE', 'FOURGON', 'CAMION')),
    prix_base DECIMAL(10, 2) NOT NULL,
    tarif_km DECIMAL(10, 2) NOT NULL,
    tarif_kg DECIMAL(10, 2) NOT NULL
);

-- Insertion des tarifs
INSERT INTO tarifs (type_vehicule, prix_base, tarif_km, tarif_kg) VALUES
('VELO', 500, 100, 50),
('MOTO', 800, 150, 75),
('VOITURE', 1500, 250, 100),
('FOURGON', 3000, 400, 150),
('CAMION', 5000, 600, 250);

-- Table commandes
CREATE TABLE commandes (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES utilisateurs(id),
    adresse_depart VARCHAR(255) NOT NULL,
    adresse_arrivee VARCHAR(255) NOT NULL,
    type_vehicule VARCHAR(20) CHECK (type_vehicule IN ('VELO', 'MOTO', 'VOITURE', 'FOURGON', 'CAMION')),
    poids_colis DECIMAL(10, 2),
    distance_km DECIMAL(10, 2),
    prix DECIMAL(10, 2),
    statut VARCHAR(20) DEFAULT 'EN_ATTENTE' CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table livraisons
CREATE TABLE livraisons (
    id SERIAL PRIMARY KEY,
    commande_id INT REFERENCES commandes(id),
    livreur_id INT REFERENCES livreurs(id),
    statut VARCHAR(20) DEFAULT 'ASSIGNEE' CHECK (statut IN ('ASSIGNEE', 'EN_TRANSIT', 'LIVREE', 'ECHOUEE')),
    date_debut TIMESTAMP,
    date_fin TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table positions
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    livreur_id INT REFERENCES livreurs(id),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    utilisateur_id INT REFERENCES utilisateurs(id),
    message TEXT NOT NULL,
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);