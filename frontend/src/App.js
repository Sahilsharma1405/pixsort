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
                            <div className="dropdown">
                                <span className="nav-link">Gallery</span>
                                <div className="dropdown-content">
                                    <Link to="/gallery">My Gallery</Link>
                                    <Link to="/public-gallery">Public Gallery</Link>
                                </div>
                            </div>
                            <Link to="/upload" className="nav-link">Upload</Link>
                            <button onClick={logoutUser} className="nav-button">Logout</button>
                        </>
                    ) : (
                        <>
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
                    <Route path="/profile" element={<PrivateRoute><ProfilePage/></PrivateRoute>} />
                    <Route path="/upload" element={<PrivateRoute><ImageUploader /></PrivateRoute>} />
                    <Route path="/gallery" element={<PrivateRoute><Gallery /></PrivateRoute>} />
                    <Route path="/public-gallery" element={<PublicGallery/>} />
                    <Route path="/gallery/:categoryName" element={<PrivateRoute><CategoryGallery /></PrivateRoute>} />
                </Routes>
            </main>
            <Footer/>
        </div>
    );
}

export default App;