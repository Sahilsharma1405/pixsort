import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext.jsx'; // Use .jsx for consistency

const PrivateRoute = ({ children }) => {
    // --- FIX: Use the correct variable name `authTokens` (plural) ---
    const { authTokens } = useContext(AuthContext);

    // --- FIX: Check `authTokens` here as well ---
    return authTokens ? children : <Navigate to="/login" />;
};

export default PrivateRoute;