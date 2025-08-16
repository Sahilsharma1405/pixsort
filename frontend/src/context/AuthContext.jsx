import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loginUser = useCallback(async (username, password) => {
        try {
            const response = await axiosInstance.post('/api/auth/login/', {
                username,
                password,
            });
            
            if (response.data.access_token) {
                setAuthTokens(response.data);
                setUser(response.data.user);
                localStorage.setItem('authTokens', JSON.stringify(response.data));
                navigate('/');
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("Login failed! Please check your username and password.");
            throw error; 
        }
    }, [navigate]);

    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    }, [navigate]);
    
    useEffect(() => {
        const checkUserLoggedIn = async () => {
            if (authTokens) {
                try {
                    const response = await axiosInstance.get('/api/auth/user/');
                    setUser(response.data);
                } catch (error) {
                    console.log("Token verification failed, logging out.");
                    logoutUser();
                }
            }
            setLoading(false);
        };
        
        checkUserLoggedIn();
    // This is the correct and safe dependency array
    }, [authTokens, logoutUser]);

    const contextData = {
        authTokens,
        user,
        loading,
        loginUser,
        logoutUser,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {loading ? <p>Loading...</p> : children}
        </AuthContext.Provider>
    );
};

export default AuthContext;