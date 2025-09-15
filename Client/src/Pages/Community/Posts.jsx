import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { usePosts } from '../../Context/PostsContext';
import API from '../../API/axios';
import PostModal from '../../Components/Community/PostModal';
import PostCard from '../../Components/Community/PostCard';
import CreatePostModal from '../../Components/Community/CreatePostModal';
import NotificationToast from '../../Components/Community/NotificationToast';

const Posts = () => {
    const [newPost, setNewPost] = useState({ title: '', content: '' });
    const [editingPost, setEditingPost] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [notification, setNotification] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showPostModal, setShowPostModal] = useState(false);

    const { user } = useAuth();
    const { 
        posts, 
        loading, 
        error, 
        voteCounts, 
        commentCounts, 
        userVotes,
        personalizationStatus,
        personalizationReason,
        addPost,
        updatePost: updatePostFromContext,
        deletePost: deletePostFromContext,
        handleVote: handleVoteFromContext
    } = usePosts();

    // filter out posts created by the current user
    const visiblePosts = posts.filter(p => p.studentName !== user.username);

    // Auto-hide notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        console.log("User:", user);
    }, [user]);
        

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
    };

    const createPost = async (e) => {
        e.preventDefault();
        if (!newPost.title.trim() || !newPost.content.trim() || !user) return;

        setIsPosting(true);
        try {
            const postData = {
                title: newPost.title.trim(),
                content: newPost.content.trim(),
                studentId: user.studentId
            };

            console.log('Sending post data:', postData);

            const result = await addPost(postData);

            if (result.success) {
                setNewPost({ title: '', content: '' });
                setShowCreateModal(false);
                showNotification('Post created successfully! 🎉');
            } else {
                showNotification(result.error, 'error');
            }
        } catch (error) {
            console.error('Error creating post:', error);
            showNotification('Failed to create post. Please try again.', 'error');
        } finally {
            setIsPosting(false);
        }
    };

    const updatePost = async (postId, updatedPostData) => {
        const result = await updatePostFromContext(postId, updatedPostData);
        if (result.success) {
            setEditingPost(null);
            showNotification('Post updated successfully! ✏️');
        } else {
            showNotification(result.error, 'error');
        }
    };

    const deletePost = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;

        const result = await deletePostFromContext(postId);
        if (result.success) {
            showNotification('Post deleted successfully! 🗑️');
        } else {
            showNotification(result.error, 'error');
        }
    };

    const openPostModal = (post) => {
        setSelectedPost(post);
        setShowPostModal(true);
    };

    const closePostModal = () => {
        setSelectedPost(null);
        setShowPostModal(false);
    };

    const handleVote = async (postId, voteType) => {
        const result = await handleVoteFromContext(postId, voteType);
        if (!result.success) {
            showNotification(result.error, 'error');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-lg text-gray-300 font-medium">Loading posts...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="text-center p-8 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50">
                    <div className="text-lg text-gray-300 font-medium">Please log in to view posts.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Notification Toast */}
            {notification && (
                <NotificationToast notification={notification} onClose={() => setNotification(null)} />
            )}

            {/* Header */}
            <div className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                                Community Posts
                            </h1>
                            <p className="text-gray-400 text-sm">Share your thoughts with the community</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-medium"
                        >
                            Create Post
                        </button>
                    </div>
                </div>
            </div>

            {/* Personalization Status Banner */}
            {personalizationStatus === 'disabled' && (
                <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg mx-4 sm:mx-6 lg:mx-8 my-4">
                    <div className="max-w-7xl mx-auto px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-yellow-300 text-sm font-medium">
                                    Personalized feed temporarily unavailable
                                </p>
                                <p className="text-yellow-200/80 text-xs mt-1">
                                    {personalizationReason === 'API rate limit reached' 
                                        ? 'AI service rate limit reached. Showing all posts without personalization.'
                                        : 'Showing all posts without personalization due to service limitations.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Quick Post Trigger */}
                <div 
                    className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 p-6 mb-8 cursor-pointer hover:shadow-xl transition-all transform hover:scale-[1.02] max-w-2xl mx-auto"
                    onClick={() => setShowCreateModal(true)}
                >
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                                {user.username?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 bg-gray-700/50 rounded-full px-4 py-3 text-gray-400 hover:bg-gray-700 transition-colors">
                            Have a study question, resource, or need a study buddy, {user.username?.split(' ')[0]}?
                        </div>
                    </div>
                </div>

                {/* Posts Feed - Responsive Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                    {visiblePosts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            userId={user.studentId}
                            editingPost={editingPost}
                            setEditingPost={setEditingPost}
                            updatePost={updatePost}
                            deletePost={deletePost}
                            onOpenModal={openPostModal}
                            onVote={handleVote}
                            voteCount={voteCounts[post.id] || 0}
                            commentCount={commentCounts[post.id] || 0}
                            userVote={userVotes[post.id] || 0}
                        />
                    ))}
                </div>
                
                {visiblePosts.length === 0 && (
                    <div className="text-center py-16 max-w-2xl mx-auto">
                        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                        </div>
                        <p className="text-gray-300 text-xl mb-4">No study posts yet!</p>
                        <p className="text-gray-400 mb-6">Be the first to ask a question or share a study resource.</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-medium"
                        >
                            Create First Study Post
                        </button>
                    </div>
                )}
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                newPost={newPost}
                setNewPost={setNewPost}
                onSubmit={createPost}
                isPosting={isPosting}
            />

            {/* Post Modal */}
            <PostModal
                post={selectedPost}
                isOpen={showPostModal}
                onClose={closePostModal}
                onPostUpdate={() => {}} // No need to refetch since context handles updates
                showNotification={showNotification}
                userVote={selectedPost ? userVotes[selectedPost.id] || 0 : 0}
            />
        </div>
    );
};

export default Posts;