import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosInstance';
import './Gallery.css'; // Reuse the gallery styles

function MyPurchasesPage() {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPurchasedImages = async () => {
            try {
                const response = await axios.get('/api/my-purchases/');
                setImages(response.data);
            } catch (error) {
                console.error("Failed to fetch purchased images:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPurchasedImages();
    }, []);

    if (isLoading) {
        return <div className="loading-message">Loading your purchased images...</div>;
    }

    return (
        <div className="gallery-container">
            <h2>My Purchases</h2>
            <div className="image-grid">
                {images.length > 0 ? (
                    images.map(image => (
                        <div key={image.id} className="image-card">
                            <img src={image.image_file} alt={image.title} />
                            <div className="image-info">
                                <p><strong>Title:</strong> {image.title || 'N/A'}</p>
                                <p><strong>From:</strong> {image.owner_username}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>You haven't purchased any images yet.</p>
                )}
            </div>
        </div>
    );
}

export default MyPurchasesPage;