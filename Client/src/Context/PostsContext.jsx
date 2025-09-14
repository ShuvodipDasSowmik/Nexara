import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../API/axios';
import { useAuth } from './AuthContext';

const PostsContext = createContext();

export const usePosts = () => {
    const context = useContext(PostsContext);
    if (!context) {
        throw new Error('usePosts must be used within a PostsProvider');
    }
    return context;
};

export const PostsProvider = ({ children }) => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [initialized, setInitialized] = useState(false);
    const [voteCounts, setVoteCounts] = useState({});
    const [commentCounts, setCommentCounts] = useState({});
    const [userVotes, setUserVotes] = useState({});
    
    const { user } = useAuth();

    // Fetch posts when user logs in and context hasn't been initialized
    useEffect(() => {
        if (user && !initialized) {
            fetchPosts();
        }
    }, [user, initialized]);

    const fetchPosts = async () => {
        if (loading) return; // Prevent multiple simultaneous fetches
        
        setLoading(true);
        setError(null);
        
        try {
            console.log('Fetching posts from context...');
            const response = await API.get('/posts');
            console.log('Posts response:', response);
            
            const fetchedPosts = response.data;
            setPosts(fetchedPosts);
            
            // Fetch vote and comment counts for each post
            const voteCountPromises = fetchedPosts.map(post => 
                API.get(`/posts/${post.id}/votes`).catch(() => ({ data: 0 }))
            );
            const commentCountPromises = fetchedPosts.map(post => 
                API.get(`/posts/${post.id}/comments/count`).catch(() => ({ data: 0 }))
            );
            
            const voteCountResponses = await Promise.all(voteCountPromises);
            const commentCountResponses = await Promise.all(commentCountPromises);
            
            const newVoteCounts = {};
            const newCommentCounts = {};
            
            fetchedPosts.forEach((post, index) => {
                newVoteCounts[post.id] = voteCountResponses[index]?.data || 0;
                newCommentCounts[post.id] = commentCountResponses[index]?.data || 0;
            });
            
            setVoteCounts(newVoteCounts);
            setCommentCounts(newCommentCounts);

            // Fetch current user's vote for each post (if logged in)
            const newUserVotes = {};
            if (user) {
                const userVotePromises = fetchedPosts.map(post => 
                    API.get(`/posts/${post.id}/vote?studentId=${user.studentId}`).catch(() => ({ data: 0 }))
                );
                const userVoteResponses = await Promise.all(userVotePromises);
                
                fetchedPosts.forEach((post, index) => {
                    newUserVotes[post.id] = userVoteResponses[index]?.data || 0;
                });
            }
            
            setUserVotes(newUserVotes);
            setInitialized(true);
            
        } catch (error) {
            console.error('Error fetching posts:', error);
            setError('Failed to load posts. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addPost = async (postData) => {
        try {
            const response = await API.post('/posts', postData);
            
            if (response.status === 201) {
                const returned = response.data;
                // Ensure the UI has the poster's name/id immediately. Fall back to provided postData
                const newPost = {
                    ...returned,
                    studentName: returned.studentName || postData.studentName,
                    studentId: returned.studentId || postData.studentId,
                };
                // Add the new post to the beginning of the posts array
                setPosts(prevPosts => [newPost, ...prevPosts]);
                
                // Initialize vote and comment counts for the new post
                setVoteCounts(prev => ({ ...prev, [newPost.id]: 0 }));
                setCommentCounts(prev => ({ ...prev, [newPost.id]: 0 }));
                setUserVotes(prev => ({ ...prev, [newPost.id]: 0 }));
                
                return { success: true, post: newPost };
            }
        } catch (error) {
            console.error('Error creating post:', error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data ||
                `Failed to create post. Status: ${error.response?.status}` ||
                'Failed to create post. Please try again.';
            return { success: false, error: errorMessage };
        }
    };

    const updatePost = async (postId, updatedPostData) => {
        try {
            const response = await API.put(`/posts/${postId}`, updatedPostData);
            
            if (response.status === 200) {
                const updatedPost = response.data;
                setPosts(prevPosts => 
                    prevPosts.map(post => 
                        post.id === postId ? { ...post, ...updatedPost } : post
                    )
                );
                return { success: true, post: updatedPost };
            }
        } catch (error) {
            console.error('Error updating post:', error);
            return { success: false, error: 'Failed to update post. Please try again.' };
        }
    };

    const deletePost = async (postId) => {
        try {
            const response = await API.delete(`/posts/${postId}`);
            
            if (response.status === 204 || response.status === 200) {
                // Remove the post from the array
                setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
                
                // Clean up related data
                setVoteCounts(prev => {
                    const newCounts = { ...prev };
                    delete newCounts[postId];
                    return newCounts;
                });
                setCommentCounts(prev => {
                    const newCounts = { ...prev };
                    delete newCounts[postId];
                    return newCounts;
                });
                setUserVotes(prev => {
                    const newVotes = { ...prev };
                    delete newVotes[postId];
                    return newVotes;
                });
                
                return { success: true };
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            return { success: false, error: 'Failed to delete post. Please try again.' };
        }
    };

    const handleVote = async (postId, voteType) => {
        if (!user) return { success: false, error: 'Please log in to vote.' };

        try {
            const currentVote = userVotes[postId] || 0;
            let response;

            if (currentVote === voteType) {
                // Remove vote if clicking the same vote type
                response = await API.delete(`/posts/${postId}/vote?studentId=${user.studentId}`);
                setUserVotes(prev => ({ ...prev, [postId]: 0 }));
                setVoteCounts(prev => ({ 
                    ...prev, 
                    [postId]: (prev[postId] || 0) - voteType 
                }));
            } else {
                // Add or change vote
                const endpoint = voteType === 1 ? 'upvote' : 'downvote';
                response = await API.post(`/posts/${postId}/${endpoint}?studentId=${user.studentId}`);
                
                const oldVote = userVotes[postId] || 0;
                const voteDifference = voteType - oldVote;
                
                setUserVotes(prev => ({ ...prev, [postId]: voteType }));
                setVoteCounts(prev => ({ 
                    ...prev, 
                    [postId]: (prev[postId] || 0) + voteDifference 
                }));
            }

            return { success: true };
        } catch (error) {
            console.error('Error voting:', error);
            return { success: false, error: 'Failed to vote. Please try again.' };
        }
    };

    const updateCommentCount = (postId, increment = true) => {
        setCommentCounts(prev => ({
            ...prev,
            [postId]: Math.max(0, (prev[postId] || 0) + (increment ? 1 : -1))
        }));
    };

    const value = {
        posts,
        loading,
        error,
        initialized,
        voteCounts,
        commentCounts,
        userVotes,
        fetchPosts,
        addPost,
        updatePost,
        deletePost,
        handleVote,
        updateCommentCount
    };

    return (
        <PostsContext.Provider value={value}>
            {children}
        </PostsContext.Provider>
    );
};