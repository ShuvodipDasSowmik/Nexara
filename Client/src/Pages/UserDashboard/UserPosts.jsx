import { useState } from "react";
import { useAuth } from "../../Context/AuthContext";
import { usePosts } from "../../Context/PostsContext";
import PostCard from "../../Components/Community/PostCard";
import PostModal from "../../Components/Community/PostModal";
import AlertModal from "../../Components/Common/AlertModal";

export default function UserPosts() {
    const { currentUser } = useAuth();
    const { posts, loading, error, voteCounts, commentCounts, userVotes, updatePost, deletePost, handleVote, fetchPosts } = usePosts();

    const [editingPost, setEditingPost] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [showPostModal, setShowPostModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState(null);

    if (!currentUser) {
        return <div className="text-gray-400 italic">Please sign in to view your posts.</div>;
    }

    const userPosts = (posts || []).filter(p => String(p.studentId) === String(currentUser.studentId));

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const openPostModal = (post) => {
        setSelectedPost(post);
        setShowPostModal(true);
    };

    const closePostModal = () => {
        setSelectedPost(null);
        setShowPostModal(false);
    };

    // No-op: context updates will keep local UI in sync, avoid refetching all posts
    const onPostUpdate = () => {};

    if (loading) return (
        <div className="text-gray-300">Loading posts...</div>
    );

    if (error) return (
        <div className="text-red-400">{String(error)}</div>
    );

    if (!userPosts || userPosts.length === 0) {
        return <div className="text-gray-400 italic">You haven't created any posts yet.</div>;
    }

    return (
        <div className="w-full">
            {notification && (
                <div className={`mb-2 ${notification.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{notification.message}</div>
            )}

            {/* Grid: large=3 cols, md=2, sm=1 - ensure takes full width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {(userPosts || []).map(post => (
                    <div key={post.id} className="w-full">
                        <PostCard
                            post={post}
                            userId={currentUser.studentId}
                            editingPost={editingPost}
                            setEditingPost={setEditingPost}
                            updatePost={async (id, data) => {
                                const res = await updatePost(id, data);
                                if (res?.success) showNotification('Post updated');
                            }}
                            deletePost={async (id) => {
                                // open stylized confirm modal instead of native confirm
                                setPendingDeleteId(id);
                                setConfirmOpen(true);
                            }}
                            onOpenModal={(p) => openPostModal(p)}
                            onVote={async (postId, voteType) => {
                                const res = await handleVote(postId, voteType);
                                if (!res.success) showNotification(res.error || 'Failed to vote', 'error');
                            }}
                            voteCount={voteCounts[post.id] || 0}
                            commentCount={commentCounts[post.id] || 0}
                            userVote={userVotes[post.id] || 0}
                        />
                    </div>
                ))}
            </div>

            <PostModal
                post={selectedPost}
                isOpen={showPostModal}
                onClose={closePostModal}
                onPostUpdate={onPostUpdate}
                showNotification={showNotification}
                userVote={selectedPost ? userVotes[selectedPost.id] || 0 : 0}
            />

            <AlertModal
                isOpen={confirmOpen}
                title="Delete Post"
                message="Are you sure you want to delete this post? This action cannot be undone."
                type="error"
                confirmText="Delete"
                cancelText="Cancel"
                onClose={() => { setConfirmOpen(false); setPendingDeleteId(null); }}
                onConfirm={async () => {
                    setConfirmOpen(false);
                    const id = pendingDeleteId;
                    setPendingDeleteId(null);
                    if (!id) return;
                    const res = await deletePost(id);
                    if (res?.success) showNotification('Post deleted');
                    else showNotification(res?.error || 'Failed to delete post', 'error');
                }}
            />
        </div>
    );
}
