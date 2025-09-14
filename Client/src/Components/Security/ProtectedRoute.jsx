import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isLoggedIn, user, loading } = useAuth();

    // While auth provider is initializing, show the same full-screen loader used in the dashboard.
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-200">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-lg">Authorizing You To Access The Protected Route...</span>
            </div>
        );
    }

    if (!isLoggedIn) {
        // If an admin area is required, redirect to admin signin
        if (requiredRole === 'admin') {
            return <Navigate to="/admin/signin" replace />;
        }
        return <Navigate to="/signup" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;