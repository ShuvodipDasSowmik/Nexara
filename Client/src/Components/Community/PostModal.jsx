import React, { useState, useEffect } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { usePosts } from '../../Context/PostsContext';
import API from '../../API/axios';
import CommentSection from './CommentSection';

const PostModal = ({ post, isOpen, onClose, onPostUpdate, showNotification, userVote: initialUserVote }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const { voteCounts, commentCounts, userVotes, handleVote: handleVoteFromContext, updateCommentCount, updateComment, deleteComment } = usePosts();

    // Get current values from context
    const voteCount = voteCounts[post?.id] || 0;
    const commentCount = commentCounts[post?.id] || 0;
    const userVote = userVotes[post?.id] || 0;

    useEffect(() => {
        if (isOpen && post) {
            fetchComments();
        }
    }, [isOpen, post]);

    const fetchComments = async () => {
        if (!post) return;
        
        setLoading(true);
        try {
            const response = await API.get(`/posts/${post.id}/comments`);
            setComments(response.data); // Each comment now has studentName
        } catch (error) {
            console.error('Error fetching comments:', error);
            showNotification('Failed to load comments. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (voteType) => {
        if (!user) return;

        try {
            const res = await handleVoteFromContext(post.id, voteType);
            if (res && res.success === false) {
                showNotification(res.error || 'Failed to register vote. Please try again.', 'error');
            } else {
                showNotification(`${voteType === 1 ? 'Upvoted' : 'Downvoted'} successfully!`);
            }
        } catch (error) {
            console.error('Error voting:', error);
            showNotification('Failed to register vote. Please try again.', 'error');
        }
    };

    const handleCommentAdded = () => {
        // Refresh comments locally and update context counts without re-fetching all posts
        fetchComments();
        updateCommentCount(post.id, true);
    };

    const handleCommentUpdated = async (commentId, updatedContent) => {
        const result = await updateComment(commentId, updatedContent);
        if (result.success) {
            // Update the comment in local state
            setComments(prevComments => 
                prevComments.map(comment => 
                    comment.id === commentId 
                        ? { ...comment, content: updatedContent, updatedAt: new Date().toISOString() }
                        : comment
                )
            );
        }
        return result;
    };

    const handleCommentDeleted = async (commentId) => {
        const result = await deleteComment(commentId);
        if (result.success) {
            // Remove the comment from local state
            setComments(prevComments => 
                prevComments.filter(comment => comment.id !== commentId)
            );
            // Update comment count
            updateCommentCount(post.id, false);
        }
        return result;
    };

    if (!isOpen || !post) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden">
            <div className="bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 w-full max-w-4xl h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-700/50 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            Post Details
                        </h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto">
                    {/* Post Content */}
                    <div className="p-6 border-b border-gray-700/50">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">
                                    {post.studentName?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-200">{post.studentName}</h3>
                                <p className="text-sm text-gray-400">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <h3 className="text-2xl font-semibold text-gray-200 mb-4">{post.title}</h3>
                        <p className="text-gray-300 leading-relaxed mb-6">{post.content}</p>

                        {/* Vote Buttons with counts */}
                        <div className="flex items-center space-x-4">
                            <button 
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all transform hover:scale-105 shadow-sm text-gray-300 ${
                                    userVote === 1 ? 'bg-green-600/70 text-white' : 'bg-gray-700/50 hover:bg-green-600/20 hover:text-green-400'
                                }`}
                                onClick={() => handleVote(1)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <span className="text-sm font-medium">Upvote</span>
                            </button>
                            
                            <div className="flex items-center space-x-2 px-3 py-2 text-gray-300">
                                <span className="text-lg font-semibold">{voteCount}</span>
                                <span className="text-sm">votes</span>
                            </div>
                            
                            <button 
                                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all transform hover:scale-105 shadow-sm text-gray-300 ${
                                    userVote === -1 ? 'bg-red-600/70 text-white' : 'bg-gray-700/50 hover:bg-red-600/20 hover:text-red-400'
                                }`}
                                onClick={() => handleVote(-1)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                <span className="text-sm font-medium">Downvote</span>
                            </button>
                            
                            <div className="flex items-center space-x-2 px-3 py-2 text-gray-300">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <span className="text-sm font-medium">{commentCount} comments</span>
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="flex-1">
                        <CommentSection
                            postId={post.id}
                            comments={comments}
                            loading={loading}
                            onCommentAdded={handleCommentAdded}
                            onCommentUpdated={handleCommentUpdated}
                            onCommentDeleted={handleCommentDeleted}
                            showNotification={showNotification}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostModal;
