import { useEffect, useState } from 'react';
import client from '../api/client';
import SuiviCommande from '../components/SuiviCommande';

const VEHICULES = ['VELO', 'MOTO', 'VOITURE', 'FOURGON', 'CAMION'];

export default function DashboardClient() {
    const [commandes, setCommandes] = useState([]);
    const [livraisons, setLivraisons] = useState([]);
    const [suivi, setSuivi] = useState(null);
    const [erreur, setErreur] = useState('');
    const [form, setForm] = useState({
        adresse_depart: '', adresse_arrivee: '', type_vehicule: 'MOTO', poids_colis: '', distance_km: '',
    });

    const chargerDonnees = async () => {
        const [resCommandes, resLivraisons] = await Promise.all([
            client.get('/commandes'),
            client.get('/livraisons'),
        ]);
        setCommandes(resCommandes.data);
        setLivraisons(resLivraisons.data);
    };

    useEffect(() => {
        chargerDonnees();
    }, []);

    const majChamp = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

    const creerCommande = async (e) => {
        e.preventDefault();
        setErreur('');
        try {
            await client.post('/commandes', form);
            setForm({ adresse_depart: '', adresse_arrivee: '', type_vehicule: 'MOTO', poids_colis: '', distance_km: '' });
            chargerDonnees();
        } catch (err) {
            setErreur(err.response?.data?.erreur || 'Erreur lors de la création');
        }
    };

    const livraisonPour = (commandeId) => livraisons.find((l) => l.commande_id === commandeId);

    return (
        <div className="page">
            <h1>Mes commandes</h1>

            <form className="card form" onSubmit={creerCommande}>
                <h2>Nouvelle commande</h2>
                {erreur && <p className="erreur">{erreur}</p>}
                <label>
                    Adresse de départ
                    <input value={form.adresse_depart} onChange={majChamp('adresse_depart')} required />
                </label>
                <label>
                    Adresse d'arrivée
                    <input value={form.adresse_arrivee} onChange={majChamp('adresse_arrivee')} required />
                </label>
                <label>
                    Véhicule
                    <select value={form.type_vehicule} onChange={majChamp('type_vehicule')}>
                        {VEHICULES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                </label>
                <label>
                    Poids du colis (kg)
                    <input type="number" step="0.1" value={form.poids_colis} onChange={majChamp('poids_colis')} required />
                </label>
                <label>
                    Distance (km)
                    <input type="number" step="0.1" value={form.distance_km} onChange={majChamp('distance_km')} required />
                </label>
                <button type="submit" className="btn btn-primary">Commander</button>
            </form>

            <div className="liste">
                {commandes.length === 0 && <p className="hint">Aucune commande pour le moment.</p>}
                {commandes.map((commande) => {
                    const livraison = livraisonPour(commande.id);
                    const peutSuivre = livraison && ['ASSIGNEE', 'EN_TRANSIT'].includes(livraison.statut);
                    return (
                        <div key={commande.id} className="card">
                            <div className="carte-entete">
                                <strong>{commande.adresse_depart} → {commande.adresse_arrivee}</strong>
                                <span className={`badge badge-${commande.statut}`}>{commande.statut}</span>
                            </div>
                            <p>{commande.type_vehicule} · {commande.poids_colis} kg · {commande.distance_km} km · {commande.prix} FCFA</p>
                            {peutSuivre && (
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSuivi(suivi === livraison.id ? null : livraison.id)}
                                >
                                    {suivi === livraison.id ? 'Masquer le suivi' : 'Suivre la livraison'}
                                </button>
                            )}
                            {suivi === livraison?.id && <SuiviCommande livraisonId={livraison.id} />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
