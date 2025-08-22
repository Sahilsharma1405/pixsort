import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosInstance';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons
import './AuthForm.css';

function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [password2, setPassword2] = useState('');
    const navigate = useNavigate();

    // --- NEW: State for password visibility ---
    const [showPassword, setShowPassword] = useState(false);

    // --- NEW: Memoized password validation ---
    const passwordValidations = useMemo(() => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            digit: /[0-9]/.test(password),
        };
    }, [password]);

    const isPasswordValid = Object.values(passwordValidations).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isPasswordValid) {
            alert("Please ensure your password meets all the requirements.");
            return;
        }

        if (password !== password2) {
            alert("Passwords do not match!");
            return;
        }

        try {
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
                
                {/* --- NEW: Password field with visibility toggle --- */}
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>
                </div>

                {/* --- NEW: Real-time validation checklist --- */}
                <ul className="password-validation-list">
                    <li className={passwordValidations.length ? 'valid' : ''}>At least 8 characters</li>
                    <li className={passwordValidations.uppercase ? 'valid' : ''}>At least one uppercase letter</li>
                    <li className={passwordValidations.digit ? 'valid' : ''}>At least one number</li>
                </ul>

                <div className="form-group">
                    <label htmlFor="password2">Confirm Password</label>
                    <div className="password-input-wrapper">
                        <input 
                            type={showPassword ? "text" : "password"} 
                            id="password2" 
                            value={password2} 
                            onChange={(e) => setPassword2(e.target.value)} 
                            required 
                        />
                    </div>
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