const jwt = require('jsonwebtoken');

// Vérifie le token JWT et attache l'utilisateur décodé à req.utilisateur
function verifierToken(req, res, next) {
    const enTete = req.headers['authorization'];
    const token = enTete && enTete.startsWith('Bearer ') ? enTete.slice(7) : null;

    if (!token) {
        return res.status(401).json({ erreur: 'Authentification requise' });
    }

    try {
        req.utilisateur = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ erreur: 'Token invalide ou expiré' });
    }
}

// À utiliser après verifierToken : n'autorise que les rôles listés
function autoriser(...rolesAutorises) {
    return (req, res, next) => {
        if (!rolesAutorises.includes(req.utilisateur.role)) {
            return res.status(403).json({ erreur: 'Accès refusé' });
        }
        next();
    };
}

module.exports = { verifierToken, autoriser };
