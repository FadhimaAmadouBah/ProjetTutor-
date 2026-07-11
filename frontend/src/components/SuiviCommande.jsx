import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import client from '../api/client';
import socket from '../socket';
import '../leafletIconFix';

const CENTRE_PAR_DEFAUT = [14.6928, -17.4467]; // Dakar

export default function SuiviCommande({ livraisonId }) {
    const [position, setPosition] = useState(null);

    useEffect(() => {
        let annule = false;

        client.get(`/livraisons/${livraisonId}/positions`).then(({ data }) => {
            if (!annule && data.length > 0) {
                setPosition({ latitude: data[0].latitude, longitude: data[0].longitude });
            }
        });

        if (!socket.connected) socket.connect();
        socket.emit('rejoindre_livraison', livraisonId);

        const surPosition = (data) => {
            if (String(data.livraison_id) === String(livraisonId)) {
                setPosition({ latitude: data.latitude, longitude: data.longitude });
            }
        };
        socket.on('position_mise_a_jour', surPosition);

        return () => {
            annule = true;
            socket.off('position_mise_a_jour', surPosition);
        };
    }, [livraisonId]);

    const centre = position
        ? [parseFloat(position.latitude), parseFloat(position.longitude)]
        : CENTRE_PAR_DEFAUT;

    return (
        <div className="carte-conteneur">
            <MapContainer center={centre} zoom={13} style={{ height: '350px', width: '100%' }}>
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {position && (
                    <Marker position={centre}>
                        <Popup>Position du livreur</Popup>
                    </Marker>
                )}
            </MapContainer>
            {!position && <p className="hint">En attente de la position du livreur...</p>}
        </div>
    );
}
