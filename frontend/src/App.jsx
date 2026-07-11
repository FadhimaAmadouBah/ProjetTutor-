import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import RouteProtegee from './components/RouteProtegee';
import Accueil from './pages/Accueil';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import DashboardClient from './pages/DashboardClient';
import DashboardLivreur from './pages/DashboardLivreur';
import DashboardAdmin from './pages/DashboardAdmin';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <Routes>
                    <Route path="/" element={<Accueil />} />
                    <Route path="/connexion" element={<Connexion />} />
                    <Route path="/inscription" element={<Inscription />} />
                    <Route
                        path="/client"
                        element={
                            <RouteProtegee role="client">
                                <DashboardClient />
                            </RouteProtegee>
                        }
                    />
                    <Route
                        path="/livreur"
                        element={
                            <RouteProtegee role="livreur">
                                <DashboardLivreur />
                            </RouteProtegee>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <RouteProtegee role="admin">
                                <DashboardAdmin />
                            </RouteProtegee>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
