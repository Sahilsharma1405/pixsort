import React, { useState, useEffect, useContext } from 'react';
import axios from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import PaymentModal from './PaymentModal';
import './MarketplacePage.css';

function MarketplacePagee() {
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const [selectedImage, setSelectedImage] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchMarketplaceImages = async () => {
            try {
                const response = await axios.get('/api/marketplace/');
                setImages(response.data);
            } catch (error) {
                console.error("Failed to fetch marketplace images:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMarketplaceImages();
    }, []);

    const handlePurchase = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("You must be logged in to purchase an image.");
            return;
        }
        setIsProcessing(true);
        try {
            await axios.post(`/api/images/${selectedImage.id}/purchase/`);
            alert(`Successfully purchased "${selectedImage.title}"!`);
            setIsModalOpen(false);
            setImages(images.filter(img => img.id !== selectedImage.id));
        } catch (error) {
            console.error("Purchase failed:", error.response?.data);
            alert(`Purchase failed: ${JSON.stringify(error.response?.data)}`);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return <div className="loading-message">Loading Marketplace...</div>;
    }

    return (
        <div className="marketplace-container">
            <h2>Marketplace</h2>
            <p className="marketplace-subtitle">Discover and purchase unique AI-categorized images from our community.</p>
            <div className="marketplace-grid">
                {images.map(image => (
                    <div key={image.id} className="item-card">
                        <img src={image.image_file} alt={image.title} />
                        <div className="item-info">
                            <h3>{image.title || 'Untitled'}</h3>
                            <p className="item-description">{image.description || 'No description available.'}</p>
                            <div className="item-footer">
                                <span className="item-price">${image.price}</span>
                                <button
                                    className="buy-button"
                                    disabled={user?.username === image.owner_username}
                                    onClick={() => {
                                        if (!user) {
                                            alert("Please log in to make a purchase.");
                                            return;
                                        }
                                        setSelectedImage(image);
                                        setIsModalOpen(true);
                                    }}
                                >
                                    {user?.username === image.owner_username ? "Your Item" : "Buy Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <PaymentModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handlePurchase}
                isProcessing={isProcessing}
            />
        </div>
    );
}

export default MarketplacePagee;