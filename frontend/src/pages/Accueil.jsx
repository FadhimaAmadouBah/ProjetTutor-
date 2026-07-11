import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Accueil() {
    const { user } = useAuth();

    if (user?.role === 'admin') return <Navigate to="/admin" replace />;
    if (user?.role === 'livreur') return <Navigate to="/livreur" replace />;
    if (user?.role === 'client') return <Navigate to="/client" replace />;

    return (
        <div className="page-centered">
            <div className="card">
                <h1>🚚 LivraisonApp</h1>
                <p>Plateforme de gestion de livraisons en temps réel.</p>
                <p>Connecte-toi ou crée un compte pour commencer.</p>
            </div>
        </div>
    );
}
