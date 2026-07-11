import { useEffect, useState } from 'react';
import client from '../api/client';
import CarteAdmin from '../components/CarteAdmin';

export default function DashboardAdmin() {
    const [commandes, setCommandes] = useState([]);
    const [livreurs, setLivreurs] = useState([]);
    const [livraisons, setLivraisons] = useState([]);
    const [commandeId, setCommandeId] = useState('');
    const [livreurId, setLivreurId] = useState('');
    const [erreur, setErreur] = useState('');

    const chargerDonnees = async () => {
        const [resCommandes, resLivreurs, resLivraisons] = await Promise.all([
            client.get('/commandes'),
            client.get('/livreurs'),
            client.get('/livraisons'),
        ]);
        setCommandes(resCommandes.data);
        setLivreurs(resLivreurs.data);
        setLivraisons(resLivraisons.data);
    };

    useEffect(() => {
        chargerDonnees();
    }, []);

    const commandesEnAttente = commandes.filter((c) => c.statut === 'EN_ATTENTE');
    const livreursDisponibles = livreurs.filter((l) => l.disponible);
    const livraisonsActives = livraisons.filter((l) => ['ASSIGNEE', 'EN_TRANSIT'].includes(l.statut));

    const affecterLivreur = async (e) => {
        e.preventDefault();
        setErreur('');
        try {
            await client.post('/livraisons', { commande_id: commandeId, livreur_id: livreurId });
            setCommandeId('');
            setLivreurId('');
            chargerDonnees();
        } catch (err) {
            setErreur(err.response?.data?.erreur || "Erreur lors de l'affectation");
        }
    };

    return (
        <div className="page">
            <h1>Tableau de bord admin</h1>

            <div className="card">
                <h2>Carte des livraisons en cours</h2>
                <CarteAdmin livraisonsActives={livraisonsActives} />
            </div>

            <form className="card form" onSubmit={affecterLivreur}>
                <h2>Affecter un livreur</h2>
                {erreur && <p className="erreur">{erreur}</p>}
                <label>
                    Commande en attente
                    <select value={commandeId} onChange={(e) => setCommandeId(e.target.value)} required>
                        <option value="">-- Choisir --</option>
                        {commandesEnAttente.map((c) => (
                            <option key={c.id} value={c.id}>
                                #{c.id} — {c.adresse_depart} → {c.adresse_arrivee}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Livreur disponible
                    <select value={livreurId} onChange={(e) => setLivreurId(e.target.value)} required>
                        <option value="">-- Choisir --</option>
                        {livreursDisponibles.map((l) => (
                            <option key={l.id} value={l.id}>{l.prenom} {l.nom} ({l.vehicule})</option>
                        ))}
                    </select>
                </label>
                <button type="submit" className="btn btn-primary">Affecter</button>
            </form>

            <div className="liste">
                <h2>Toutes les livraisons</h2>
                {livraisons.map((livraison) => (
                    <div key={livraison.id} className="card">
                        <div className="carte-entete">
                            <strong>{livraison.adresse_depart} → {livraison.adresse_arrivee}</strong>
                            <span className={`badge badge-${livraison.statut}`}>{livraison.statut}</span>
                        </div>
                        <p>Livreur : {livraison.prenom} {livraison.nom}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
