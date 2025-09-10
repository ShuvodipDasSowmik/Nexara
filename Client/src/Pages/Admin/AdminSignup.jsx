import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import API from '../../API/axios';

export default function AdminSignup() {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        adminKey: ''
    });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.username.trim()) {
            setError('Username is required');
            return;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return;
        }
        if (!formData.password) {
            setError('Password is required');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (!formData.adminKey.trim()) {
            setError('Admin registration key is required');
            return;
        }

        setSubmitting(true);

        try {
            const response = await API.post('/admin/signup', {
                username: formData.username.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                adminKey: formData.adminKey.trim()
            });

            if (response.data.success) {
                // Auto sign in the new admin
                const signinResponse = await API.post('/auth/signin', {
                    username: formData.username.trim(),
                    password: formData.password
                });

                if (signinResponse.data.user) {
                    setUser(signinResponse.data.user);
                    navigate('/admin/dashboard');
                } else {
                    navigate('/signin');
                }
            }
        } catch (error) {
            console.error('Admin signup error:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Failed to create admin account. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-8">
            <div className="bg-white/5 backdrop-blur-sm w-full rounded-2xl shadow-md p-2 border border-gray-700/50 flex flex-col justify-center max-w-sm">
                <div className="text-center mb-2">
                    <h1 className="text-lg font-medium text-white mb-0">Admin Registration</h1>
                    <p className="text-gray-200 text-[11px] mt-0.5">Create an administrator account</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-1">
                    <div>
                        <label htmlFor="username" className="block text-xs font-medium text-gray-300 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-xs bg-gray-900/60 text-gray-100 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-xs bg-gray-900/60 text-gray-100 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-xs bg-gray-900/60 text-gray-100 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 pr-7"
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-300"
                            >
                                {showPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-300 mb-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-2 py-1 text-xs bg-gray-900/60 text-gray-100 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 pr-7"
                                placeholder="Confirm your password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-2 flex items-center text-gray-400 hover:text-gray-300"
                            >
                                {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="adminKey" className="block text-xs font-medium text-gray-300 mb-1">
                            Admin Registration Key
                        </label>
                        <input
                            type="password"
                            id="adminKey"
                            name="adminKey"
                            value={formData.adminKey}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-xs bg-gray-900/60 text-gray-100 border border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                            placeholder="Enter admin registration key"
                            required
                        />
                        <p className="text-[11px] text-gray-400 mt-1">
                            Contact system administrator for the registration key
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-1 px-2 mt-1 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-700 transition-all duration-150 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                                <span className="text-xs">Creating Account...</span>
                            </div>
                        ) : (
                            'Create Admin Account'
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-300">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/signin')}
                            className="text-gray-400 hover:text-blue-400 font-medium text-[11px]"
                        >
                            Sign In
                        </button>
                    </p>
                </div>
            </div>

            {submitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                        <div className="text-white text-xs">Creating admin account...</div>
                    </div>
                </div>
            )}
        </div>
    );
}
