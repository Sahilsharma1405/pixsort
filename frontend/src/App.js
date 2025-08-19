import React, { useContext } from 'react';
import {  Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage';
import ImageUploader from './components/ImageUploader';
import Gallery from './components/Gallery';
import CategoryGallery from './components/CategoryGallery';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import PrivateRoute from './components/PrivateRoute';
import AuthContext from './context/AuthContext';
import './App.css';
import ProfilePage from './components/Profilepage';
import Footer from './components/Footer';
import PublicGallery from './components/PublicGallery';
import MarketplacePagee from './components/MarketplacePagee';
import MyPurchasesPage from './components/MyPurchasesPage';

function App() {
    // --- FIX: Use the correct variable name `authTokens` (plural) ---
    const { authTokens, user, logoutUser } = useContext(AuthContext);

    // This component no longer contains the <Router>
    return (
        <div className="App">
            <nav className="main-nav">
                <Link to="/" className="nav-link">Pixsort</Link>
                <div>
                    {/* --- FIX: Check `authTokens` (plural) here too --- */}
                    {authTokens ? (
                        <>
                            <Link to="/profile" className="nav-link nav-user">Hello, {user?.username}</Link>
                            <Link to="/marketplace" className="nav-link">Marketplace</Link>
                             <div className="dropdown">
                                <span className="nav-link">My Library</span>
                                <div className="dropdown-content">
                                    <Link to="/gallery">My Gallery</Link>
                                    <Link to="/my-purchases">My Purchases</Link>
                                    <Link to="//public-gallery">Public Gallery</Link>
                                </div>
                            </div>
                            <Link to="/upload" className="nav-link">Upload</Link>
                            <button onClick={logoutUser} className="nav-button">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link to="/" className="nav-link">Home</Link>
                            <Link to="/public-gallery" className="nav-link">Public Gallery</Link>
                            <Link to="/marketplace" className="nav-link">Marketplace</Link>
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/signup" className="nav-link">Sign Up</Link>
                        </>
                    )}
                </div>
            </nav>

            <main>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/public-gallery" element={<PublicGallery />} />
                    <Route path="/marketplace" element={<MarketplacePagee />} />
                    {/* Private Routes */}
                    <Route path="/upload" element={<PrivateRoute><ImageUploader /></PrivateRoute>} />
                    <Route path="/gallery" element={<PrivateRoute><Gallery /></PrivateRoute>} />
                    <Route path="/gallery/:categoryName" element={<PrivateRoute><CategoryGallery /></PrivateRoute>} />
                    <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                    <Route path="/public-gallery" element={<PrivateRoute> <PublicGallery /></PrivateRoute>} />
                    <Route path="/my-purchases" element={<PrivateRoute><MyPurchasesPage /></PrivateRoute>} />
                </Routes>
            </main>
            <Footer/>
        </div>
    );
}

export default App;