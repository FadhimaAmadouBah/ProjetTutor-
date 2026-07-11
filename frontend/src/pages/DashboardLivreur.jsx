import { useEffect, useRef, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import socket from '../socket';

const PROCHAIN_STATUT = {
    ASSIGNEE: 'EN_TRANSIT',
    EN_TRANSIT: 'LIVREE',
};

export default function DashboardLivreur() {
    const { user } = useAuth();
    const [livraisons, setLivraisons] = useState([]);
    const [disponible, setDisponible] = useState(true);
    const [partageId, setPartageId] = useState(null);
    const watchIdRef = useRef(null);

    const chargerLivraisons = async () => {
        const { data } = await client.get('/livraisons');
        setLivraisons(data);
    };

    useEffect(() => {
        chargerLivraisons();
        client.get('/livreurs').then(({ data }) => {
            const moi = data.find((l) => l.id === user.livreur_id);
            if (moi) setDisponible(moi.disponible);
        });
        return () => arreterPartage();
    }, []);

    const changerDisponibilite = async () => {
        const nouvelleValeur = !disponible;
        await client.put(`/livreurs/${user.livreur_id}/disponibilite`, { disponible: nouvelleValeur });
        setDisponible(nouvelleValeur);
    };

    const changerStatut = async (livraisonId, statutActuel) => {
        const suivant = PROCHAIN_STATUT[statutActuel];
        if (!suivant) return;
        await client.put(`/livraisons/${livraisonId}/statut`, { statut: suivant });
        if (suivant === 'LIVREE') arreterPartage();
        chargerLivraisons();
    };

    const demarrerPartage = (livraisonId) => {
        if (!socket.connected) socket.connect();
        setPartageId(livraisonId);
        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                socket.emit('position_gps', {
                    livraison_id: livraisonId,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                });
            },
            (err) => console.error('Erreur géolocalisation :', err.message),
            { enableHighAccuracy: true }
        );
    };

    const arreterPartage = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setPartageId(null);
    };

    return (
        <div className="page">
            <h1>Mes livraisons</h1>

            <div className="card">
                <label className="switch-label">
                    <input type="checkbox" checked={disponible} onChange={changerDisponibilite} />
                    {disponible ? 'Disponible' : 'Indisponible'}
                </label>
            </div>

            <div className="liste">
                {livraisons.length === 0 && <p className="hint">Aucune livraison assignée pour le moment.</p>}
                {livraisons.map((livraison) => (
                    <div key={livraison.id} className="card">
                        <div className="carte-entete">
                            <strong>{livraison.adresse_depart} → {livraison.adresse_arrivee}</strong>
                            <span className={`badge badge-${livraison.statut}`}>{livraison.statut}</span>
                        </div>

                        {livraison.statut !== 'LIVREE' && livraison.statut !== 'ECHOUEE' && (
                            <div className="actions">
                                {PROCHAIN_STATUT[livraison.statut] && (
                                    <button className="btn btn-primary" onClick={() => changerStatut(livraison.id, livraison.statut)}>
                                        Marquer comme {PROCHAIN_STATUT[livraison.statut]}
                                    </button>
                                )}
                                {partageId === livraison.id ? (
                                    <button className="btn btn-secondary" onClick={arreterPartage}>Arrêter le partage GPS</button>
                                ) : (
                                    <button className="btn btn-secondary" onClick={() => demarrerPartage(livraison.id)}>Partager ma position</button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
