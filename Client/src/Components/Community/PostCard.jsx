import React from 'react';

const PostCard = ({ post, userId, editingPost, setEditingPost, updatePost, deletePost, onOpenModal, onVote, voteCount, commentCount, userVote }) => {
    const activeUp = userVote === 1;
    const activeDown = userVote === -1;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-700/50 overflow-hidden hover:shadow-xl transition-all">
            <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
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

                    {post.studentId === userId && (
                        <div className="flex space-x-2">
                            <button
                                className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all"
                                onClick={() => setEditingPost(post)}
                                title="Edit post"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-all"
                                onClick={() => deletePost(post.id)}
                                title="Delete post"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {editingPost?.id === post.id ? (
                    <div className="space-y-4">
                        <input
                            type="text"
                            className="w-full p-4 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-gray-800/50 backdrop-blur-sm text-gray-200 placeholder-gray-400"
                            value={editingPost.title}
                            onChange={(e) => setEditingPost(prev => ({ ...prev, title: e.target.value }))}
                        />
                        <textarea
                            className="w-full p-4 border border-gray-600 rounded-xl h-32 resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-gray-800/50 backdrop-blur-sm text-gray-200 placeholder-gray-400"
                            value={editingPost.content}
                            onChange={(e) => setEditingPost(prev => ({ ...prev, content: e.target.value }))}
                        />
                        <div className="flex space-x-3">
                            <button
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 font-medium"
                                onClick={() => updatePost(post.id, editingPost)}
                            >
                                Save
                            </button>
                            <button
                                className="px-6 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all font-medium"
                                onClick={() => setEditingPost(null)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="cursor-pointer" onClick={() => onOpenModal(post)}>
                        <h3 className="text-xl font-semibold text-gray-200 mb-3 line-clamp-2 hover:text-blue-400 transition-colors">{post.title}</h3>
                        <p className="text-gray-300 leading-relaxed line-clamp-4">{post.content}</p>
                    </div>
                )}
            </div>

            <div className="px-6 py-4 bg-gray-800/30 border-t border-gray-700/50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <button
                            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all transform hover:scale-105 shadow-sm text-gray-300 ${
                                activeUp ? 'bg-green-600/70 text-white' : 'bg-gray-700/50 hover:bg-green-600/20 hover:text-green-400'
                            }`}
                            onClick={() => onVote(post.id, 1)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            <span className="text-sm font-medium hidden sm:inline">Up</span>
                        </button>

                        <span className="text-sm font-semibold text-gray-300 px-2">
                            {voteCount || 0}
                        </span>

                        <button
                            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all transform hover:scale-105 shadow-sm text-gray-300 ${
                                activeDown ? 'bg-red-600/70 text-white' : 'bg-gray-700/50 hover:bg-red-600/20 hover:text-red-400'
                            }`}
                            onClick={() => onVote(post.id, -1)}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            <span className="text-sm font-medium hidden sm:inline">Down</span>
                        </button>
                    </div>

                    <button
                        className="flex items-center space-x-2 px-3 py-2 rounded-full bg-gray-700/50 hover:bg-blue-600/20 hover:text-blue-400 transition-all transform hover:scale-105 shadow-sm text-gray-300"
                        onClick={() => onOpenModal(post)}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-sm font-medium">{commentCount || 0}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PostCard;
