import React, { useState, useEffect } from 'react';
import axios from '../utils/axiosInstance';
import './ImageUploader.css'; // We'll create this CSS file next
import { useNavigate } from 'react-router-dom';
function ImageUploader() {
    // State to store the selected file
    const [selectedFile, setSelectedFile] = useState(null);
    // State to store the URL for the image preview
    const [preview, setPreview] = useState(null);
    // State to store the analysis result from the backend
    const [analysisResult, setAnalysisResult] = useState(null);
    // State to manage the loading status
    const [isLoading, setIsLoading] = useState(false);
    // State to handle any errors during upload
    const [error, setError] = useState(null);
    // State to give visual feedback when dragging a file over the drop zone
    const [isDragging, setIsDragging] = useState(false);
    const navigate = useNavigate(); // Hook for navigation

    // --- NEW STATE ---
    const [visibility, setVisibility] = useState('private'); // 'private' or 'public'
    const [isConfirmed, setIsConfirmed] = useState(false);

    // This effect creates a preview URL whenever a new file is selected
    useEffect(() => {
        if (!selectedFile) {
            setPreview(null);
            return;
        }
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [selectedFile]);

    const handleFileSelect = (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setError(null);
            setAnalysisResult(null);
            setIsConfirmed(false); // Reset confirmation on new file
        } else {
            setError("Please select a valid image file.");
            setSelectedFile(null);
        }
    };



    const handleDragEvents = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        handleDragEvents(e);
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        handleDragEvents(e);
        setIsDragging(false);
    };

     const resetUploader = () => {
        setSelectedFile(null);
        setAnalysisResult(null);
        setIsConfirmed(false);
        setVisibility('private');
    };


    const confirmVisibility = async () => {
    if (!analysisResult) return;
    try {
        await axios.patch(`/api/images/${analysisResult.id}/`, {
            is_public: visibility === 'public',
        });
        alert(`Image visibility has been set to ${visibility}.`);
        setIsConfirmed(true);
    } catch (error) {
        // --- THIS IS THE CORRECTED ERROR HANDLING ---
        console.error("Failed to update visibility", error);
        if (error.response) {
            // If the server sent back a specific error message
            alert(`Error updating visibility: ${JSON.stringify(error.response.data)}`);
        } else {
            // For network errors or other issues
            alert("An error occurred. Please check the console for details.");
        }
    }
};

    const handleDrop = (e) => {
        handleDragEvents(e);
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
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
            // Send the image to your Django API
            const response = await axios.post('/api/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAnalysisResult(response.data);
        } catch (err) {
            setError("Upload failed. Please try again.");
            console.error('Upload error:', err);
        } finally {
            setIsLoading(false);
        }
    };


   
    
    return (
        <div className="uploader-container">
            <div
                className={`drop-zone ${isDragging ? 'dragging' : ''}`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragEvents} // Prevent default browser behavior
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {preview ? (
                    <div className="image-preview">
                        <img src={preview} alt="Preview" />
                    </div>
                ) : (
                    <div className="drop-zone-prompt">
                        <span className="drop-zone-icon">🖼️</span>
                        <p>Drag & Drop Your Image Here</p>
                        <p className="or-text">or</p>
                    </div>
                )}
                <input
                    type="file"
                    id="fileInput"
                    className="file-input"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    accept="image/*"
                />
                 {!preview && <label htmlFor="fileInput" className="browse-btn">Browse Files</label>}
            </div>

            {error && <p className="error-message">{error}</p>}

            <button
                className="upload-button"
                onClick={handleUpload}
                disabled={!selectedFile || isLoading}
            >
                {isLoading ? (
                    <div className="spinner"></div>
                ) : (
                    'Analyze Image'
                )}
            </button>

            {analysisResult && (
                <div className="result-card">
                    <h3>✨ Analysis Complete ✨</h3>
                    {/* ... (result-content div is the same) ... */}
                    
                    {!isConfirmed ? (
                        // --- NEW: Visibility Choice Step ---
                        <div className="post-upload-actions">
                            <h4>Set Image Visibility:</h4>
                            <div className="visibility-options">
                                <label>
                                    <input type="radio" value="private" checked={visibility === 'private'} onChange={(e) => setVisibility(e.target.value)} />
                                    Private (Only you can see it)
                                </label>
                                <label>
                                    <input type="radio" value="public" checked={visibility === 'public'} onChange={(e) => setVisibility(e.target.value)} />
                                    Public (Visible to everyone)
                                </label>
                            </div>
                            <button onClick={confirmVisibility} className="action-btn confirm">Confirm</button>
                        </div>
                    ) : (
                        // --- NEW: Final Step ---
                        <div className="post-upload-actions">
                            <h4>What's next?</h4>
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