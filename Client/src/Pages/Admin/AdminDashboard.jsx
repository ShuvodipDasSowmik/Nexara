import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../../API/axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({});
    const [selected, setSelected] = useState(new Set());
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [localLoading, setLocalLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [analytics, setAnalytics] = useState({ countryCounts: {}, deviceCounts: {} });

    // Check if user is admin; wait for auth provider to finish loading to avoid redirect on refresh
    const { loading } = useAuth();

    useEffect(() => {
        if (!loading) {
            if (!user || user.role !== 'admin') {
                navigate('/admin/signin');
            }
        }
    }, [user, navigate, loading]);

    // Fetch users and stats - wait for all data before removing local loading
    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchAllData();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLocalLoading(true);
        try {
            await Promise.all([fetchUsers(), fetchStats(), fetchAnalytics()]);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Error loading dashboard data');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleCheckbox = (userId) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const handleSend = async () => {
        if (selected.size === 0) return;
        setSending(true);
        setError('');
        setSuccessMessage('');
        const selectedUsers = users.filter(u => selected.has(u.id));
        try {
            const res = await API.post('/admin/send-email', {
                users: selectedUsers,
                subject,
                message
            });

            setSuccessMessage(res.data?.message || `Emails sent to ${selectedUsers.length} user(s)`);
            // clear inputs & selections
            setSelected(new Set());
            setSubject('');
            setMessage('');
        } catch (err) {
            console.error('Error sending emails:', err);
            if (err.response?.data?.message) setError(err.response.data.message);
            else setError('Network error while sending emails');
        } finally {
            setSending(false);
            // remove success message after a short timeout
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await API.get('/admin/users');
            setUsers(response.data.users || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response?.status === 403) {
                setError('Access denied: Admin privileges required');
            } else {
                setError('Network error while fetching users');
            }
        } finally {
        }
    };

    const fetchStats = async () => {
        try {
            const response = await API.get('/admin/stats');
            setStats(response.data.stats || {});
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const response = await API.get('/admin/analytics');
            if (response.data?.success) {
                setAnalytics({
                    countryCounts: response.data.countryCounts || {},
                    deviceCounts: response.data.deviceCounts || {}
                });
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        // open modal instead of using native confirm
        const u = users.find(u => u.id === userId);
        setUserToDelete(u || { id: userId });
        setShowDeleteModal(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await API.delete(`/admin/users/${userToDelete.id}`);
            setUsers(users.filter(u => u.id !== userToDelete.id));
            fetchStats(); // Refresh stats
            setShowDeleteModal(false);
            setUserToDelete(null);
        } catch (error) {
            console.error('Error deleting user:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Network error while deleting user');
            }
            // keep modal open so admin can retry or cancel
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            const response = await API.put(`/admin/users/${userId}/role`, { role: newRole });
            setUsers(users.map(user => 
                user.id === userId ? { ...user, role: newRole } : user
            ));
            setShowRoleModal(false);
            setSelectedUser(null);
            fetchStats(); // Refresh stats
        } catch (error) {
            console.error('Error updating user role:', error);
            if (error.response?.data?.message) {
                setError(error.response.data.message);
            } else {
                setError('Network error while updating user role');
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                    <div className="text-gray-300 font-medium">Loading dashboard...</div>
                </div>
            </div>
        );
    }

    // Show local loading until all admin data is fetched
    if (localLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-400"></div>
                    <div className="text-gray-300 font-medium">Fetching admin data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
                    <p className="text-gray-300">Welcome back, {user?.username}</p>
                </div>
                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/50 border border-red-700/50 rounded-lg text-red-300 backdrop-blur-sm">
                        {error}
                        <button 
                            onClick={() => setError('')}
                            className="ml-2 text-red-400 hover:text-red-200 font-bold"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Total Users</h3>
                        <p className="text-3xl font-bold text-blue-400">{stats.totalUsers || 0}</p>
                    </div>
                    <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Students</h3>
                        <p className="text-3xl font-bold text-green-400">{stats.studentCount || 0}</p>
                    </div>
                    <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Admins</h3>
                        <p className="text-3xl font-bold text-purple-400">{stats.adminCount || 0}</p>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-gray-800/70 backdrop-blur-sm shadow-lg rounded-2xl border border-gray-700/50">
                    <div className="px-6 py-4 border-b border-gray-600/50">
                        <h2 className="text-lg font-semibold text-white">User Management</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-600/50">
                            <thead className="bg-gray-700/50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        <input
                                            type="checkbox"
                                            className="form-checkbox h-4 w-4 text-blue-500"
                                            checked={users.length > 0 && selected.size === users.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelected(new Set(users.map(u => u.id)));
                                                else setSelected(new Set());
                                            }}
                                        />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                        </table>

                        {/* Scrollable table body with fixed height */}
                        <div className="max-h-[420px] overflow-y-auto border-t border-gray-700/40">
                            <table className="min-w-full">
                                <tbody className="bg-transparent divide-y divide-gray-600/30">
                                    {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                checked={selected.has(user.id)}
                                                onChange={() => handleCheckbox(user.id)}
                                                className="form-checkbox h-4 w-4 text-blue-500"
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-white">
                                                    {user.username}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.role === 'admin' 
                                                    ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50' 
                                                    : 'bg-green-900/50 text-green-300 border border-green-700/50'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {formatDate(user.createdAt)}
                                        </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowRoleModal(true);
                                                }}
                                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                            >
                                                Edit Role
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                            {/* Email composer */}
                            <div className="p-6 border-t border-gray-700/40 bg-gray-800/60">
                                <h3 className="text-md font-semibold text-gray-200 mb-3">Send Email to Selected Users</h3>
                                {error && <div className="text-red-400 mb-3">{error}</div>}
                                {successMessage && <div className="text-green-400 mb-3">{successMessage}</div>}
                                <div className="grid grid-cols-1 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Subject"
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700"
                                    />
                                    <textarea
                                        placeholder="Message"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        rows={4}
                                        className="w-full p-2 rounded bg-gray-900 text-white border border-gray-700"
                                    />
                                    <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-300">{selected.size} user(s) selected</div>
                                        <div className="flex items-center space-x-3">
                                            <button
                                                onClick={() => { setSelected(new Set()); setSubject(''); setMessage(''); }}
                                                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={handleSend}
                                                disabled={sending || selected.size === 0 || !subject.trim() || !message.trim()}
                                                className={`px-4 py-2 rounded-lg text-white shadow-lg ${sending || selected.size === 0 || !subject.trim() || !message.trim() ? 'bg-gray-600/50 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'}`}
                                            >
                                                {sending ? 'Sending...' : `Send to ${selected.size} user(s)`}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>
            </div>

            {/* Analytics Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-lg font-semibold text-white mb-4">Visitor Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h3 className="text-md font-semibold text-gray-200 mb-4">Country Distribution</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={Object.entries(analytics.countryCounts || {}).map(([k,v]) => ({ name: k || 'Unknown', value: v }))} dataKey="value" nameKey="name" outerRadius={100} label>
                                        {Object.entries(analytics.countryCounts || {}).map(([k], i) => (
                                            <Cell key={k} fill={["#8884d8", "#82ca9d", "#ffc658", "#d0ed57", "#a4de6c"][i % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gray-800/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-gray-700/50">
                        <h3 className="text-md font-semibold text-gray-200 mb-4">Device Breakdown</h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={Object.entries(analytics.deviceCounts || {}).map(([k,v]) => ({ device: k || 'Unknown', count: v }))}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="device" stroke="#cbd5e1" />
                                    <YAxis stroke="#cbd5e1" />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#60a5fa" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Role Update Modal */}
            {showRoleModal && selectedUser && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700/50 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Update Role for {selectedUser.username}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="flex items-center text-gray-200">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="student"
                                        checked={selectedUser.role === 'student'}
                                        onChange={() => setSelectedUser({...selectedUser, role: 'student'})}
                                        className="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                    />
                                    Student
                                </label>
                            </div>
                            <div>
                                <label className="flex items-center text-gray-200">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="admin"
                                        checked={selectedUser.role === 'admin'}
                                        onChange={() => setSelectedUser({...selectedUser, role: 'admin'})}
                                        className="mr-3 text-blue-600 focus:ring-blue-500 focus:ring-2"
                                    />
                                    Admin
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button
                                onClick={() => {
                                    setShowRoleModal(false);
                                    setSelectedUser(null);
                                }}
                                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateRole(selectedUser.id, selectedUser.role)}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                            >
                                Update Role
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full mx-4 border border-gray-700/50 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-2">Confirm Delete</h3>
                        <p className="text-sm text-gray-300">Are you sure you want to permanently delete <span className="font-semibold text-white">{userToDelete.username || userToDelete.email || userToDelete.id}</span>? This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                                className="px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteUser}
                                className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-400 text-white rounded-lg hover:from-red-700 hover:to-red-500 transition-all shadow-lg"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
