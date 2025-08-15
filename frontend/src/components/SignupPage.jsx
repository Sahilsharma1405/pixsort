import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import './AuthForm.css';

function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== password2) {
            alert("Passwords do not match!");
            return;
        }

        try {
            // The older dj-rest-auth expects password1 and password2
            await axios.post('/api/signup/', {
                username,
                email,
                password,
            });

            alert("Registration successful! Please log in.");
            navigate('/login');

        } catch (error) {
            console.error("Signup failed:", error.response.data);
            const errorMessage = Object.entries(error.response.data)
                .map(([field, messages]) => {
                    const messageText = Array.isArray(messages) ? messages.join(', ') : messages;
                    return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${messageText}`;
                })
                .join('\n');
            alert(`Signup failed:\n${errorMessage}`);
        }
    };

    return (
        <div className="auth-form-container">
            <form onSubmit={handleSubmit} className="auth-form">
                <h2>Create Account</h2>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password2">Confirm Password</label>
                    <input type="password" id="password2" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
                </div>
                <button type="submit" className="auth-button">Sign Up</button>
                <p className="auth-switch-text">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </form>
        </div>
    );
}

export default SignupPage;