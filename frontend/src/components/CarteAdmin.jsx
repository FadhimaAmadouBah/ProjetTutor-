import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import socket from '../socket';
import '../leafletIconFix';

const CENTRE_PAR_DEFAUT = [14.6928, -17.4467]; // Dakar

// livraisonsActives : liste des livraisons en cours (statut ASSIGNEE ou EN_TRANSIT)
export default function CarteAdmin({ livraisonsActives }) {
    const [positions, setPositions] = useState({});
    const idsRejoints = useRef(new Set());

    useEffect(() => {
        if (!socket.connected) socket.connect();

        livraisonsActives.forEach((livraison) => {
            if (!idsRejoints.current.has(livraison.id)) {
                socket.emit('rejoindre_livraison', livraison.id);
                idsRejoints.current.add(livraison.id);
            }
        });

        const surPosition = (data) => {
            setPositions((prev) => ({ ...prev, [data.livraison_id]: data }));
        };
        socket.on('position_mise_a_jour', surPosition);

        return () => socket.off('position_mise_a_jour', surPosition);
    }, [livraisonsActives]);

    return (
        <MapContainer center={CENTRE_PAR_DEFAUT} zoom={12} style={{ height: '450px', width: '100%' }}>
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {livraisonsActives.map((livraison) => {
                const pos = positions[livraison.id];
                if (!pos) return null;
                return (
                    <Marker key={livraison.id} position={[parseFloat(pos.latitude), parseFloat(pos.longitude)]}>
                        <Popup>
                            Livraison #{livraison.id}<br />
                            {livraison.prenom} {livraison.nom}<br />
                            {livraison.adresse_depart} → {livraison.adresse_arrivee}
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
