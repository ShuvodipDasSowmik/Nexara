import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../API/axios';

export default function AdminDashboard() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        if (!user || !isAdmin) {
            navigate('/signin');
            return;
        }
        
        fetchData();
    }, [user, isAdmin, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            const [usersResponse, statsResponse] = await Promise.all([
                API.get('/admin/users'),
                API.get('/admin/stats')
            ]);

            if (usersResponse.data.success) {
                setUsers(usersResponse.data.users);
            }

            if (statsResponse.data.success) {
                setStats(statsResponse.data.stats);
            }
        } catch (error) {
            console.error('Error fetching admin data:', error);
            if (error.response?.status === 403) {
                setError('Access denied. Admin privileges required.');
            } else {
                setError('Failed to load admin data.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        try {
            const response = await API.delete(`/admin/users/${userId}`);
            
            if (response.data.success) {
                setUsers(users.filter(u => u.id !== userId));
                setDeleteConfirm(null);
                
                // Update stats
                if (stats) {
                    setStats(prev => ({
                        ...prev,
                        totalUsers: prev.totalUsers - 1
                    }));
                }
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setError(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await API.put(`/admin/users/${userId}/role`, { role: newRole });
            
            if (response.data.success) {
                setUsers(users.map(u => 
                    u.id === userId ? { ...u, role: newRole } : u
                ));
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            setError(error.response?.data?.message || 'Failed to update user role');
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/signin');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                    <div className="text-gray-600">Loading admin dashboard...</div>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="text-sm text-gray-600">Welcome, {user.username}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{error}</p>
                        <button
                            onClick={() => setError('')}
                            className="text-red-400 hover:text-red-600 ml-2"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Total Users</h3>
                            <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Admins</h3>
                            <p className="text-3xl font-bold text-green-600">{stats.adminCount}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Students</h3>
                            <p className="text-3xl font-bold text-purple-600">{stats.studentCount}</p>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">All Users</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((userItem) => (
                                    <tr key={userItem.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {userItem.username}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {userItem.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={userItem.role}
                                                onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                                disabled={userItem.id === user.id} // Can't change own role
                                            >
                                                <option value="student">Student</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(userItem.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {userItem.id !== user.id && (
                                                <button
                                                    onClick={() => setDeleteConfirm(userItem.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                            Confirm Delete
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDeleteUser(deleteConfirm)}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
