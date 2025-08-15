import React, { useState, useContext } from 'react';
import axios from '../utils/axiosInstance';
import AuthContext from '../context/AuthContext';
import './AuthForm.css';
import './ProfilePage.css';

function ProfilePage() {
    const { logoutUser } = useContext(AuthContext);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword1, setNewPassword1] = useState('');
    const [newPassword2, setNewPassword2] = useState('');

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword1 !== newPassword2) {
            alert("New passwords do not match!");
            return;
        }

        try {
            await axios.post('/api/auth/password/change/', {
                old_password: oldPassword,
                new_password1: newPassword1,
                new_password2: newPassword2,
            });
            alert("Password changed successfully!");
            setOldPassword('');
            setNewPassword1('');
            setNewPassword2('');
        } catch (error) {
            // --- NEW: Improved error handling ---
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error("Failed to change password:", error.response.data);
                alert(`Error: ${JSON.stringify(error.response.data)}`);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.error("A network error occurred:", error.message);
                alert(`Network Error: ${error.message}`);
            }
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm("ARE YOU SURE? This will permanently delete your account and all of your images. This action cannot be undone.")) {
            try {
                await axios.delete('/api/user/delete/');
                alert("Account deactivated successfully.");
                logoutUser();
            } catch (error) {
                // --- NEW: Improved error handling ---
                if (error.response) {
                    console.error("Failed to deactivate account:", error.response.data);
                    alert(`Error: ${JSON.stringify(error.response.data)}`);
                } else {
                    console.error("A network error occurred:", error.message);
                    alert(`Network Error: ${error.message}`);
                }
            }
        }
    };

    // The rest of your JSX remains the same
    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2>Change Password</h2>
                <form onSubmit={handleChangePassword} className="auth-form" style={{ boxShadow: 'none', padding: 0 }}>
                    <div className="form-group">
                        <label htmlFor="old_password">Old Password</label>
                        <input type="password" id="old_password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new_password1">New Password</label>
                        <input type="password" id="new_password1" value={newPassword1} onChange={e => setNewPassword1(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new_password2">Confirm New Password</label>
                        <input type="password" id="new_password2" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} required />
                    </div>
                    <button type="submit" className="auth-button">Save New Password</button>
                </form>
            </div>
            
            <div className="profile-card deactivate-card">
                <h2>Deactivate Account</h2>
                <p>Once you deactivate your account, there is no going back. Please be certain.</p>
                <button onClick={handleDeactivate} className="deactivate-button">Deactivate My Account</button>
            </div>
        </div>
    );
}

export default ProfilePage;