import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import CountUp from 'react-countup';
import AuthContext from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import './HomePage.css'; // We will create this CSS file next

function HomePage() {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axiosInstance.get('/api/stats/');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch stats", error);
            }
        };

        // Fetch stats only if a user is logged in
        if (user) {
            fetchStats();
        }
    }, [user]);

    // Render a different view for logged-out users
    if (!user) {
        return (
            <div className="homepage-container">
                <header className="hero-section">
                    <h1>Your Photos, Intelligently Organized</h1>
                    <p>Welcome to Pixsort. Sign up or log in to let AI categorize and manage your image library.</p>
                    <Link to="/signup" className="hero-cta-button">Get Started for Free</Link>
                </header>
            </div>
        );
    }

    // Render the dashboard for logged-in users
    return (
        <div className="homepage-container">
            <header className="hero-section">
                <h1>Welcome back, {user.username}!</h1>
                <p>Here's a snapshot of your media library.</p>
            </header>

            {stats && (
                <section className="stats-section">
                    <div className="stat-card">
                        <h2><CountUp end={stats.image_count} duration={2.5} /></h2>
                        <p>Images Stored</p>
                    </div>
                    <div className="stat-card">
                        <h2><CountUp end={stats.category_count} duration={2.5} /></h2>
                        <p>Unique Categories</p>
                    </div>
                    <div className="stat-card">
                        <h2>{stats.user_since}</h2>
                        <p>Member Since</p>
                    </div>
                </section>
            )}

            <section className="features-section">
                <h2>Quick Actions</h2>
                <div className="feature-cards">
                    <Link to="/upload" className="feature-card">
                        <h3>🚀 Upload New Image</h3>
                        <p>Add a new photo and let the AI work its magic.</p>
                    </Link>
                    <Link to="/gallery" className="feature-card">
                        <h3>🖼️ Browse Gallery</h3>
                        <p>View your entire collection, beautifully organized by category.</p>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default HomePage;