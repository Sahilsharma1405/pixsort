import React, { useState, useEffect } from 'react';
import axios from 'axios'; // <-- Use the standard axios library
import './Gallery.css';

function PublicGallery() {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPublicImages = async () => {
            try {
                // --- Use a relative URL to leverage the proxy ---
                const response = await axios.get('/api/public-images/');
                setImages(response.data);
            } catch (error) {
                console.error("Failed to fetch public images:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicImages();
    }, []);

    if (isLoading) {
        return <div className="loading-message">Loading public gallery...</div>;
    }

    return (
        <div className="gallery-container">
            <h2>Public Gallery</h2>
            <div className="image-grid">
                {images.length > 0 ? (
                    images.map(image => (
                        <div key={image.id} className="image-card">
                            {/* --- Use a relative path for the image source --- */}
                            <img src={image.image_file} alt="Processed" />
                            <div className="image-info">
                                <p><strong>Uploaded by:</strong> {image.owner_username}</p>
                                <p><strong>Labels:</strong> {image.detailed_labels.join(', ') || 'N/A'}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No public images have been shared yet.</p>
                )}
            </div>
        </div>
    );
}

export default PublicGallery;