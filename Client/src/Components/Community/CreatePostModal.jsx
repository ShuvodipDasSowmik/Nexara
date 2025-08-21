import React from 'react';

const CreatePostModal = ({ isOpen, onClose, newPost, setNewPost, onSubmit, isPosting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-700/50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                            Create Post
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

                <form onSubmit={onSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Post Title</label>
                        <input
                            type="text"
                            placeholder="e.g., 'Looking for a study buddy for Calculus II'"
                            className="w-full p-4 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-gray-800/50 backdrop-blur-sm text-gray-200 placeholder-gray-400"
                            value={newPost.title}
                            onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                        <textarea
                            placeholder="Share a question, resource, or study plan (e.g., 'Need help with integration techniques')."
                            className="w-full p-4 border border-gray-600 rounded-xl h-40 resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-gray-800/50 backdrop-blur-sm text-gray-200 placeholder-gray-400"
                            value={newPost.content}
                            onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button
                            type="submit"
                            disabled={isPosting}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPosting ? 'Posting...' : 'Post'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-all font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePostModal;
