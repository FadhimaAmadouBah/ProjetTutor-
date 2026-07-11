import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Connexion() {
    const [email, setEmail] = useState('');
    const [motDePasse, setMotDePasse] = useState('');
    const [erreur, setErreur] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const soumettre = async (e) => {
        e.preventDefault();
        setErreur('');
        try {
            const { data } = await client.post('/utilisateurs/connexion', {
                email,
                mot_de_passe: motDePasse,
            });
            login(data.utilisateur, data.token);

            if (data.utilisateur.role === 'admin') navigate('/admin');
            else if (data.utilisateur.role === 'livreur') navigate('/livreur');
            else navigate('/client');
        } catch (err) {
            setErreur(err.response?.data?.erreur || 'Erreur de connexion');
        }
    };

    return (
        <div className="page-centered">
            <form className="card form" onSubmit={soumettre}>
                <h2>Connexion</h2>
                {erreur && <p className="erreur">{erreur}</p>}
                <label>
                    Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </label>
                <label>
                    Mot de passe
                    <input type="password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
                </label>
                <button type="submit" className="btn btn-primary">Se connecter</button>
                <p>Pas encore de compte ? <Link to="/inscription">Inscription</Link></p>
            </form>
        </div>
    );
}
