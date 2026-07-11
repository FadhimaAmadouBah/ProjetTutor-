import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const seDeconnecter = () => {
        logout();
        navigate('/connexion');
    };

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">🚚 LivraisonApp</Link>
            <div className="navbar-links">
                {user ? (
                    <>
                        <Notifications />
                        <span className="navbar-user">{user.prenom} ({user.role})</span>
                        <button onClick={seDeconnecter} className="btn btn-secondary">Déconnexion</button>
                    </>
                ) : (
                    <>
                        <Link to="/connexion" className="btn btn-secondary">Connexion</Link>
                        <Link to="/inscription" className="btn btn-primary">Inscription</Link>
                    </>
                )}
            </div>
        </nav>
    );
}
