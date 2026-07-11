import { useEffect, useState } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Notifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [ouvert, setOuvert] = useState(false);

    const charger = () => {
        client.get('/notifications').then(({ data }) => setNotifications(data)).catch(() => {});
    };

    useEffect(() => {
        if (!user) return;
        charger();
        const intervalle = setInterval(charger, 15000);
        return () => clearInterval(intervalle);
    }, [user]);

    const marquerLue = async (id) => {
        await client.put(`/notifications/${id}/lu`);
        charger();
    };

    if (!user) return null;

    const nonLues = notifications.filter((n) => !n.lu).length;

    return (
        <div className="notifications">
            <button className="btn btn-secondary notifications-bouton" onClick={() => setOuvert(!ouvert)}>
                🔔{nonLues > 0 && <span className="notifications-badge">{nonLues}</span>}
            </button>
            {ouvert && (
                <div className="notifications-panneau">
                    {notifications.length === 0 && <p className="hint">Aucune notification.</p>}
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className={`notifications-item ${n.lu ? '' : 'non-lue'}`}
                            onClick={() => !n.lu && marquerLue(n.id)}
                        >
                            {n.message}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
