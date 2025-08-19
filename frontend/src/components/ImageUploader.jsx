import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import './ImageUploader.css';

function ImageUploader() {
    // --- Your existing state ---
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate();

    // --- State for the new multi-step flow ---
    const [uploadStep, setUploadStep] = useState('initial'); // initial -> analyzed -> listing -> confirmed
    const [saleDetails, setSaleDetails] = useState({ title: '', description: '', price: '' });

    // --- Your existing useEffect ---
    useEffect(() => {
        if (!selectedFile) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);
    
    // --- Your existing handler functions ---
    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setError(null);
            setAnalysisResult(null);
            setUploadStep('initial');
        } else {
            setError("Please select a valid image file.");
            setSelectedFile(null);
        }
    };
    
    const handleUpload = async () => {
        if (!selectedFile) {
            setError("Please select a file first!");
            return;
        }
        setIsLoading(true);
        setError(null);
        const formData = new FormData();
        formData.append('image_file', selectedFile);

        try {
            const response = await axiosInstance.post('/api/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAnalysisResult(response.data);
            setUploadStep('analyzed'); // Move to the next step
        } catch (err) {
            setError("Upload failed. Please try again.");
            console.error('Upload error:', err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetUploader = () => {
        setSelectedFile(null);
        setPreview(null);
        setAnalysisResult(null);
        setUploadStep('initial');
        setSaleDetails({ title: '', description: '', price: '' });
    };

    const handleDragEvents = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e) => { handleDragEvents(e); setIsDragging(true); };
    const handleDragLeave = (e) => { handleDragEvents(e); setIsDragging(false); };
    const handleDrop = (e) => {
        handleDragEvents(e);
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    // --- NEW: Function to handle setting visibility or listing for sale ---
    const updateImageSettings = async (isPublic, isForSale) => {
        if (!analysisResult) return;
        
        let dataToUpdate = { is_public: isPublic, for_sale: isForSale };
        if (isForSale) {
            if (!saleDetails.title || !saleDetails.price) {
                alert("Please provide a title and price to list the image for sale.");
                return;
            }
            dataToUpdate = { ...dataToUpdate, ...saleDetails };
        }

        try {
            await axiosInstance.patch(`/api/images/${analysisResult.id}/`, dataToUpdate);
            alert(`Image settings have been saved!`);
            setUploadStep('confirmed'); // Move to the final action step
        } catch (error) {
            console.error("Failed to update image settings:", error);
            alert("Error saving image settings.");
        }
    };
    
    // --- NEW: Handler for the sale form submission ---
    const handleSaleFormSubmit = (e) => {
        e.preventDefault();
        updateImageSettings(true, true);
    };

    return (
        <div className="uploader-container">
            <div
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragEvents}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {preview ? (
                    <div className="image-preview"><img src={preview} alt="Preview" /></div>
                ) : (
                    <div className="drop-zone-prompt">
                        <span className="drop-zone-icon">🖼️</span>
                        <p>Drag & Drop Your Image Here</p>
                        <p className="or-text">or</p>
                        <label htmlFor="fileInput" className="browse-btn">Browse Files</label>
                    </div>
                )}
                <input type="file" id="fileInput" className="file-input" onChange={(e) => handleFileSelect(e.target.files[0])} accept="image/*" />
            </div>

            {error && <p className="error-message">{error}</p>}

            <button className="upload-button" onClick={handleUpload} disabled={!selectedFile || isLoading || analysisResult}>
                {isLoading ? <div className="spinner"></div> : 'Analyze Image'}
            </button>

            {analysisResult && (
                <div className="result-card">
                    <h3>✨ Analysis Complete ✨</h3>
                    <div className="result-content">
                        <img src={analysisResult.image_file} alt="Analyzed" className="result-image" />
                        <div className="result-details">
                            <p><strong>📂 Categories:</strong> {analysisResult.general_categories.join(', ') || 'None'}</p>
                            <p><strong>📜 Labels:</strong> {analysisResult.detailed_labels.join(', ') || 'None'}</p>
                        </div>
                    </div>
                    
                    {uploadStep === 'analyzed' && (
                        <div className="post-upload-actions">
                            <h4>Set Image Options:</h4>
                            <div className="action-buttons">
                                <button onClick={() => setUploadStep('listing')} className="action-btn public">List for Sale</button>
                                <button onClick={() => updateImageSettings(true, false)} className="action-btn public-free">Share Publicly (Free)</button>
                                <button onClick={() => updateImageSettings(false, false)} className="action-btn private">Keep Private</button>
                            </div>
                        </div>
                    )}

                    {uploadStep === 'listing' && (
                        <div className="post-upload-actions">
                            <h4>List Image for Sale</h4>
                            <form onSubmit={handleSaleFormSubmit} className="sale-form">
                                <input type="text" placeholder="Image Title" value={saleDetails.title} onChange={e => setSaleDetails({...saleDetails, title: e.target.value})} required />
                                <textarea placeholder="Description" value={saleDetails.description} onChange={e => setSaleDetails({...saleDetails, description: e.target.value})} required />
                                <input type="number" placeholder="Price (USD)" step="0.01" value={saleDetails.price} onChange={e => setSaleDetails({...saleDetails, price: e.target.value})} required />
                                <div className="action-buttons">
                                    <button type="button" onClick={() => setUploadStep('analyzed')} className="action-btn private">Back</button>
                                    <button type="submit" className="action-btn confirm">Confirm & List</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {uploadStep === 'confirmed' && (
                        <div className="post-upload-actions">
                            <h4>Success! What's next?</h4>
                            <div className="action-buttons">
                                <button onClick={resetUploader} className="action-btn another">Analyze Another</button>
                                <button onClick={() => navigate('/')} className="action-btn home">Go to Home</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ImageUploader;