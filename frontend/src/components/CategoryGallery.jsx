import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import './CategoryGallery.css'; // Import new CSS

function CategoryGallery() {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { categoryName } = useParams(); // Get category name from URL

    useEffect(() => {
        // Capitalize the first letter for the title
        const formattedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

        const fetchImages = async () => {
            setIsLoading(true);
            try {
                // Fetch images using the new category filter
                const response = await axios.get(`/api/images/?category=${formattedCategory}`);
                setImages(response.data);
            } catch (error) {
                console.error(`Failed to fetch images for category ${formattedCategory}:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchImages();
    }, [categoryName]); // Re-fetch if the categoryName changes

    if (isLoading) {
        return <div className="loading-message">Loading {categoryName} images...</div>;
    }

    return (
        <div className="category-gallery-container">
            <div className="category-gallery-header">
                <Link to="/gallery" className="back-link">← Back to All Galleries</Link>
                <h1>Category: {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}</h1>
            </div>
            <div className="category-image-grid">
                {images.map(image => (
                    <div key={image.id} className="category-image-card">
                        <img src={image.image_file} alt="Processed" />
                        <div className="category-image-info">
                            <p>{image.detailed_labels.join(', ') || 'N/A'}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default CategoryGallery;