import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../api/client';

export default function Inscription() {
    const [form, setForm] = useState({
        nom: '', prenom: '', email: '', mot_de_passe: '', telephone: '', role: 'client', vehicule: '',
    });
    const [erreur, setErreur] = useState('');
    const [succes, setSucces] = useState(false);
    const navigate = useNavigate();

    const majChamp = (champ) => (e) => setForm({ ...form, [champ]: e.target.value });

    const soumettre = async (e) => {
        e.preventDefault();
        setErreur('');
        try {
            await client.post('/utilisateurs/inscription', form);
            setSucces(true);
            setTimeout(() => navigate('/connexion'), 1200);
        } catch (err) {
            setErreur(err.response?.data?.erreur || "Erreur lors de l'inscription");
        }
    };

    return (
        <div className="page-centered">
            <form className="card form" onSubmit={soumettre}>
                <h2>Inscription</h2>
                {erreur && <p className="erreur">{erreur}</p>}
                {succes && <p className="succes">Compte créé ! Redirection...</p>}
                <label>
                    Nom
                    <input value={form.nom} onChange={majChamp('nom')} required />
                </label>
                <label>
                    Prénom
                    <input value={form.prenom} onChange={majChamp('prenom')} required />
                </label>
                <label>
                    Email
                    <input type="email" value={form.email} onChange={majChamp('email')} required />
                </label>
                <label>
                    Mot de passe
                    <input type="password" value={form.mot_de_passe} onChange={majChamp('mot_de_passe')} required />
                </label>
                <label>
                    Téléphone
                    <input value={form.telephone} onChange={majChamp('telephone')} />
                </label>
                <label>
                    Rôle
                    <select value={form.role} onChange={majChamp('role')}>
                        <option value="client">Client</option>
                        <option value="livreur">Livreur</option>
                        <option value="admin">Admin</option>
                    </select>
                </label>
                {form.role === 'livreur' && (
                    <label>
                        Véhicule
                        <select value={form.vehicule} onChange={majChamp('vehicule')} required>
                            <option value="">-- Choisir --</option>
                            <option value="VELO">Vélo</option>
                            <option value="MOTO">Moto</option>
                            <option value="VOITURE">Voiture</option>
                            <option value="FOURGON">Fourgon</option>
                            <option value="CAMION">Camion</option>
                        </select>
                    </label>
                )}
                <button type="submit" className="btn btn-primary">Créer mon compte</button>
                <p>Déjà un compte ? <Link to="/connexion">Connexion</Link></p>
            </form>
        </div>
    );
}
