import React, { useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import API from '../../API/axios';

const CommentSection = ({ postId, comments, loading, onCommentAdded, showNotification }) => {
    const [newComment, setNewComment] = useState('');
    const [replyTo, setReplyTo] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const addComment = async (parentId = null) => {
        if (!user) return;

        const commentText = parentId ? replyTo[parentId] : newComment;
        if (!commentText?.trim()) return;

        setIsSubmitting(true);
        try {
            const response = await API.post(`/posts/${postId}/comments`, {
                content: commentText,
                studentId: user.id,
                studentName: user.name,
                parentId: parentId
            });

            if (response.status === 201) {
                if (parentId) {
                    setReplyTo(prev => ({ ...prev, [parentId]: '' }));
                } else {
                    setNewComment('');
                }
                showNotification(parentId ? 'Reply added successfully! 💬' : 'Comment added successfully! 💬');
                onCommentAdded();
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            showNotification('Failed to add comment. Please try again.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderComments = (commentList, parentId = null) => {
        const filteredComments = commentList?.filter(comment => comment.parentId === parentId) || [];

        return filteredComments.map(comment => (
            <div key={comment.id} className={`${parentId ? 'ml-6 bg-gray-700/30' : 'bg-gray-700/50'} p-4 rounded-xl mb-3 border border-gray-600/50 backdrop-blur-sm`}>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                                {comment.studentName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-200 text-sm">{comment.studentName}</span>
                            <span className="text-xs text-gray-400 block">
                                {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                </div>
                <p className="text-gray-300 mb-3 leading-relaxed">{comment.content}</p>
                <button
                    className="text-blue-400 text-sm hover:text-blue-300 transition-colors font-medium"
                    onClick={() => setReplyTo(prev => ({
                        ...prev,
                        [comment.id]: prev[comment.id] ? '' : 'reply'
                    }))}
                >
                    Reply
                </button>

                {replyTo[comment.id] && (
                    <div className="mt-4 bg-gray-800/50 p-4 rounded-lg border border-gray-600/30 backdrop-blur-sm">
                        <textarea
                            placeholder="Write a reply..."
                            className="w-full p-3 border border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-gray-800/50 backdrop-blur-sm text-gray-200 placeholder-gray-400"
                            rows="2"
                            value={replyTo[comment.id] === 'reply' ? '' : replyTo[comment.id]}
                            onChange={(e) => setReplyTo(prev => ({
                                ...prev,
                                [comment.id]: e.target.value
                            }))}
                        />
                        <div className="flex gap-2 mt-3">
                            <button
                                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 font-medium"
                                onClick={() => addComment(comment.id)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Replying...' : 'Reply'}
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-all font-medium"
                                onClick={() => setReplyTo(prev => ({ ...prev, [comment.id]: '' }))}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-4">
                    {renderComments(commentList, comment.id)}
                </div>
            </div>
        ));
    };

    return (
        <div className="flex flex-col h-full">
            {/* Comments Header */}
            <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-200">
                    Comments ({comments.length})
                </h3>
            </div>

            {/* Add Comment */}
            <div className="p-4 border-b border-gray-700/50 flex-shrink-0">
                <textarea
                    placeholder="Write a comment..."
                    className="w-full p-4 border border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-gray-800/50 backdrop-blur-sm text-gray-200 placeholder-gray-400"
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button 
                    className="mt-3 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 font-medium disabled:opacity-50"
                    onClick={() => addComment()}
                    disabled={isSubmitting || !newComment.trim()}
                >
                    {isSubmitting ? 'Commenting...' : 'Comment'}
                </button>
            </div>

            {/* Comments List - Remove height restrictions to allow natural scrolling */}
            <div className="p-4 flex-1">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {renderComments(comments)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentSection;
