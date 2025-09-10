import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import { HiMenu } from "react-icons/hi";

export default function Header() {
    const STORAGE_KEY = "nexara_profile";

    // read cached profile synchronously so header can render immediately
    const initialCache = (() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const { currentUser, loading: authLoading, logout } = useAuth();
    const [optimisticUser, setOptimisticUser] = useState(initialCache);
    const [showUser, setShowUser] = useState(!!initialCache || !!currentUser);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [closing, setClosing] = useState(false);
    const navigate = useNavigate();

    const closeDrawer = () => {
        // play closing animation then hide
        setClosing(true);
        setTimeout(() => {
            setClosing(false);
            setDrawerOpen(false);
        }, 260);
    };

    useEffect(() => {
        // when auth provides real user, update optimistic snapshot and persist it
        if (currentUser) {
            const snapshot = {
                fullName: currentUser.fullName || null,
                username: currentUser.username || null,
                photoURL: currentUser.photoURL || null,
            };
            setOptimisticUser(snapshot);
            setShowUser(true);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
            } catch (e) {
                // ignore storage errors
            }
        } else if (!authLoading && !currentUser) {
            // when signed out, clear optimistic view
            setOptimisticUser(null);
            setShowUser(false);
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch {}
        }
    }, [currentUser, authLoading]);

    const handleLogout = async () => {
        try {
            await logout();
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch {}
            navigate("/signup");
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    // quick helper to generate initials
    const initials = (name = "") => {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 0) return "U";
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    };

    // prefer the real currentUser if available, otherwise show optimistic snapshot
    const userToShow = currentUser || optimisticUser;

    return (
        <header className="w-full px-4 py-3 bg-gradient-to-r from-blue-950 via-gray-900 to-gray-900 border-b border-gray-800/60 shadow-lg">
            <style>{`
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0%); } }
                @keyframes slideOutRight { from { transform: translateX(0%); } to { transform: translateX(100%); } }
                .slide-in-right { animation: slideInRight 260ms ease-out forwards; }
                .slide-out-right { animation: slideOutRight 220ms ease-in forwards; }
            `}</style>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Left: brand only */}
                <div className="flex items-center gap-4">
                    <Link to="/" className="text-white font-bold text-2xl">
                        Nexara
                    </Link>
                </div>
                {/* Right: navigation + profile */}
                <div className="flex items-center gap-4">
                    {/* Desktop nav */}
                    <nav className="hidden md:flex gap-3 text-gray-300">
                        <Link to="/chat" className="hover:text-white">Chat</Link>
                        <Link to="/tools" className="hover:text-white">Tools</Link>
                        <Link to="/community/posts" className="hover:text-white">Community</Link>
                    </nav>
                    {/* Profile area (desktop) */}
                    {showUser && userToShow ? (
                        <div className="hidden md:flex items-center gap-3">
                            <Link to="/user/dashboard" aria-label="Open user dashboard" className="flex items-center">
                                {userToShow.photoURL ? (
                                    <img
                                        src={userToShow.photoURL}
                                        alt="avatar"
                                        className="w-9 h-9 rounded-full object-cover border border-gray-700 cursor-pointer"
                                    />
                                ) : (
                                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold border border-gray-700 cursor-pointer">
                                        {initials(userToShow.fullName || userToShow.username || "")}
                                    </div>
                                )}
                            </Link>
                            <span className="hidden sm:block text-sm text-gray-200">
                                {userToShow.fullName || userToShow.username}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-sm active:scale-95 transition-transform"
                                aria-label="Logout"
                            >
                                Logout
                            </button>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center">
                            <Link
                                to="/signup"
                                aria-label="Sign in or sign up"
                                className="relative inline-block group text-sm text-white px-2 py-1"
                            >
                                <span className="relative z-10">Sign in / Sign up</span>
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-x-0 bottom-0 h-[2px] bg-white origin-center transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                                />
                            </Link>
                        </div>
                    )}
                    {/* Mobile menu button */}
                    <button className="md:hidden p-2 rounded text-blue-300 hover:bg-gray-800 focus:outline-none" onClick={() => setDrawerOpen(true)}>
                        <HiMenu size={28} />
                    </button>
                </div>
            </div>
            {/* Drawer for mobile */}
            {(drawerOpen || closing) && (
                <div className="fixed inset-0 z-50">
                    {/* backdrop */}
                    <div className="absolute inset-0 bg-black/60" onClick={closeDrawer} />

                    {/* drawer - positioned on the right */}
                    <aside className={`absolute right-0 top-0 h-full w-64 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 shadow-xl p-6 flex flex-col gap-6 ${closing ? 'slide-out-right' : 'slide-in-right'}`}>
                        <div className="flex justify-between items-center mb-4">
                            <Link to="/" className="text-white font-bold text-xl" onClick={closeDrawer}>
                                Nexara
                            </Link>
                            <button className="text-gray-400 hover:text-white" onClick={closeDrawer}>&times;</button>
                        </div>
                        <nav className="flex flex-col gap-4 text-gray-200">
                            <Link to="/chat" className="hover:text-blue-400" onClick={closeDrawer}>Chat</Link>
                            <Link to="/tools" className="hover:text-blue-400" onClick={closeDrawer}>Tools</Link>
                            <Link to="/community/posts" className="hover:text-blue-400" onClick={closeDrawer}>Community</Link>
                        </nav>
                        <div className="mt-auto">
                            {showUser && userToShow ? (
                                <div className="flex items-center gap-3 mb-4">
                                    <Link to="/user/dashboard" aria-label="Open user dashboard" className="flex items-center" onClick={closeDrawer}>
                                        {userToShow.photoURL ? (
                                            <img
                                                src={userToShow.photoURL}
                                                alt="avatar"
                                                className="w-9 h-9 rounded-full object-cover border border-gray-700 cursor-pointer"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold border border-gray-700 cursor-pointer">
                                                {initials(userToShow.fullName || userToShow.username || "")}
                                            </div>
                                        )}
                                    </Link>
                                    <span className="text-sm text-gray-200">{userToShow.fullName || userToShow.username}</span>
                                </div>
                            ) : null}
                            {showUser && userToShow ? (
                                <button onClick={() => { handleLogout(); closeDrawer(); }} className="w-full px-3 py-2 bg-red-600 text-white rounded text-sm active:scale-95 transition-transform">Logout</button>
                            ) : (
                                <Link to="/signup" aria-label="Sign in or sign up" className="block w-full text-center px-3 py-2 bg-blue-700 text-white rounded text-sm mt-2" onClick={closeDrawer}>
                                    Sign in / Sign up
                                </Link>
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </header>
    );
}
