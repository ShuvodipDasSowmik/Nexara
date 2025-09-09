import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import API from '../../API/axios';

export default function AdminAuth() {
    const navigate = useNavigate();
    const { signin } = useAuth();
    const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        adminKey: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when user starts typing
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            if (mode === 'signin') {
                // Admin signin using API
                const response = await API.post('/admin/signin', {
                    usernameOrEmail: formData.username,
                    password: formData.password
                });

                setSuccess('Admin signed in successfully!');
                // Use the existing signin method to update context
                await signin({
                    username: formData.username,
                    password: formData.password
                });
                setTimeout(() => {
                    navigate('/admin/dashboard');
                }, 1000);
            } else {
                // Admin signup using API
                const response = await API.post('/admin/signup', {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    adminKey: formData.adminKey
                });

                setSuccess('Admin account created successfully! You can now sign in.');
                setMode('signin');
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    email: '',
                    adminKey: ''
                }));
            }
        } catch (error) {
            console.error('Admin auth error:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Network error. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin {mode === 'signin' ? 'Sign In' : 'Sign Up'}</h1>
                    <p className="text-gray-600 mt-2">
                        {mode === 'signin' 
                            ? 'Access the admin dashboard' 
                            : 'Create a new admin account'
                        }
                    </p>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {success}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username {mode === 'signin' && '/ Email'}
                        </label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder={mode === 'signin' ? 'Enter username or email' : 'Enter username'}
                        />
                    </div>

                    {/* Email (signup only) */}
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter email address"
                            />
                        </div>
                    )}

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            placeholder="Enter password"
                        />
                    </div>

                    {/* Admin Key (signup only) */}
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Registration Key
                            </label>
                            <input
                                type="password"
                                id="adminKey"
                                name="adminKey"
                                value={formData.adminKey}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                placeholder="Enter admin registration key"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Contact system administrator for the registration key
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                            </>
                        ) : (
                            mode === 'signin' ? 'Sign In' : 'Create Admin Account'
                        )}
                    </button>
                </form>

                {/* Mode Toggle */}
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'signin' ? 'signup' : 'signin');
                            setError('');
                            setSuccess('');
                            setFormData({
                                username: '',
                                password: '',
                                email: '',
                                adminKey: ''
                            });
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                        {mode === 'signin' 
                            ? "Need to create an admin account? Sign up" 
                            : "Already have an admin account? Sign in"
                        }
                    </button>
                </div>

                {/* Back to Student Login */}
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/signin')}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                        ← Back to student login
                    </button>
                </div>
            </div>
        </div>
    );
}
