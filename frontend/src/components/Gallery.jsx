import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import './Gallery.css';

function Gallery() {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(''); // State for the search input


     const fetchImages = async (query = '') => {
        setIsLoading(true);
        const url = query ? `/api/images/?search=${query}` : '/api/images/';
        try {
            const response = await axios.get(url);
            setImages(response.data);
        } catch (error) {
            console.error("Failed to fetch images:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchImages(); // Fetch all images on initial load
    }, []);

    const handleSearch = (e) => {
        e.preventDefault(); // Prevent page refresh on form submit
        fetchImages(searchTerm);
    };

    // --- Function to handle deleting an image ---
    const handleDelete = async (imageId) => {
        if (window.confirm("Are you sure you want to delete this image?")) {
            try {
                await axios.delete(`/api/images/${imageId}/`);
                setImages(images.filter(image => image.id !== imageId));
            } catch (error) {
                console.error("Failed to delete image:", error);
                alert("There was an error deleting the image.");
            }
        }
    };

    // --- Logic to group images by category ---
    const groupedImages = images.reduce((acc, image) => {
        const category = image.general_categories[0] || 'Uncategorized';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(image);
        return acc;
    }, {});

    if (isLoading) {
        return <div className="loading-message">Loading gallery...</div>;
    }

    return (
        <div className="gallery-container">
            <h2>Your Image Gallery</h2>
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search for labels (e.g., dog, car, pizza)..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="search-button">Search</button>
            </form>
            {Object.keys(groupedImages).length > 0 ? (
                Object.keys(groupedImages).map(category => (
                    <section key={category} className="category-section">
                        <div className="category-header">
                            <h3>{category}</h3>
                            <Link to={`/gallery/${category.toLowerCase()}`} className="view-all-link">
                                View all
                            </Link>
                        </div>
                        <div className="image-grid">
                            {groupedImages[category].slice(0, 3).map(image => (
                                <div key={image.id} className="image-card">
                                    <img src={image.image_file} alt="Processed" />
                                    <div className="image-info">
                                        <p><strong>Labels:</strong> {image.detailed_labels.join(', ') || 'N/A'}</p>
                                        
                                        {/* --- The missing delete button --- */}
                                        <button 
                                            onClick={() => handleDelete(image.id)} 
                                            className="delete-btn"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))
            ) : (
                <p className="no-results-message">No images found. Try a different search or upload some images!</p>
            )}
        </div>
    );
}

export default Gallery;