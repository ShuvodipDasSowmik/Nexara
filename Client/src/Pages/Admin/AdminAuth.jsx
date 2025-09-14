import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';
import API from '../../API/axios';

export default function AdminAuth() {
    const navigate = useNavigate();
    const { signin, setUser } = useAuth();
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
                // Set user in auth context from admin signin response
                if (response?.data?.user) {
                    setUser(response.data.user);
                }
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
            <div
                className={`bg-white/5 backdrop-blur-sm w-full rounded-2xl shadow-2xl p-4 border border-gray-700/50 flex flex-col justify-center ${mode === 'signup' ? 'max-w-2xl' : 'max-w-md'}`}
                style={{ minHeight: 0, height: 'auto', maxHeight: '95vh' }}
            >
                {/* Top segmented mode buttons */}
                <div className="flex mb-4">
                    <button
                        type="button"
                        onClick={() => setMode('signin')}
                        className={`w-1/2 py-2 text-lg font-semibold rounded-l-xl transition-colors duration-200 ${mode === 'signin' ? 'bg-gray-900 text-white' : 'bg-gray-700/20 text-gray-200 hover:bg-gray-700/40'}`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className={`w-1/2 py-2 text-lg font-semibold rounded-r-xl transition-colors duration-200 ${mode === 'signup' ? 'bg-gray-900 text-white' : 'bg-gray-700/20 text-gray-200 hover:bg-gray-700/40'}`}
                    >
                        Sign Up
                    </button>
                </div>

                <div className={`transition-all duration-250 ${''} flex-1 flex flex-col justify-center`} style={{ minHeight: 0 }}>
                    {/* Header */}
                    <div className="text-center mb-3">
                        <h1 className="text-2xl font-bold text-white">Admin {mode === 'signin' ? 'Sign In' : 'Sign Up'}</h1>
                        <p className="text-gray-300 mt-2 text-sm">
                            {mode === 'signin' ? 'Access the admin dashboard' : 'Create a new admin account'}
                        </p>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">{error}</div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">{success}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username {mode === 'signin' && '/ Email'}</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-gray-900/60 text-gray-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                placeholder={mode === 'signin' ? 'Enter username or email' : 'Enter username'}
                            />
                        </div>

                        {mode === 'signup' && (
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-gray-900/60 text-gray-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    placeholder="Enter email address"
                                />
                            </div>
                        )}

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-gray-900/60 text-gray-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                placeholder="Enter password"
                            />
                        </div>

                        {mode === 'signup' && (
                            <div>
                                <label htmlFor="adminKey" className="block text-sm font-medium text-gray-300 mb-2">Admin Registration Key</label>
                                <input
                                    type="password"
                                    id="adminKey"
                                    name="adminKey"
                                    value={formData.adminKey}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-gray-900/60 text-gray-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                                    placeholder="Enter admin registration key"
                                />
                                <p className="text-xs text-gray-400 mt-1">Contact system administrator for the registration key</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                            {submitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                    {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                                </>
                            ) : (
                                mode === 'signin' ? 'Sign In' : 'Create Admin Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button type="button" onClick={() => navigate('/signin')} className="text-gray-400 hover:text-gray-300 text-sm">← Back to student login</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
