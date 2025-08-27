import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";

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
	const navigate = useNavigate();

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
		<header className="w-full px-4 py-3 bg-gradient-to-r from-gray-900/80 to-transparent border-b border-gray-800/60">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				{/* Left: brand only */}
				<div className="flex items-center gap-4">
					<Link to="/" className="text-white font-bold text-lg">
						Nexara
					</Link>
				</div>

				{/* Right: navigation followed by profile (nav now beside profile) */}
				<div className="flex items-center gap-4">
					<nav className="hidden sm:flex gap-3 text-gray-300">
						<Link to="/chat" className="hover:text-white">Chat</Link>
						<Link to="/tools" className="hover:text-white">Tools</Link>
						<Link to="/groupcall" className="hover:text-white">Call</Link>
						<Link to="/community/posts" className="hover:text-white">Community</Link>
					</nav>

					{/* profile area: render cached/optimistic user immediately, update when real user arrives */}
					{showUser && userToShow ? (
						<div className="flex items-center gap-3">
							{/* Avatar is now a link to the user dashboard */}
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

							{/* name shown on larger screens, kept inline */}
							<span className="hidden sm:block text-sm text-gray-200">
								{userToShow.fullName || userToShow.username}
							</span>

							{/* Red logout button inline with avatar/name; no hover effect, active click effect */}
							<button
								onClick={handleLogout}
								className="ml-2 px-3 py-1 bg-red-600 text-white rounded text-sm active:scale-95 transition-transform"
								aria-label="Logout"
							>
								Logout
							</button>
						</div>
					) : (
						// show a single sign in / sign up link when not authenticated
						<div className="flex items-center">
							<Link
								to="/signup"
								aria-label="Sign in or sign up"
								className="relative inline-block group text-sm text-white px-2 py-1"
							>
								<span className="relative z-10">Sign in / Sign up</span>
								{/* underline that grows from center */}
								<span
									aria-hidden="true"
									className="absolute inset-x-0 bottom-0 h-[2px] bg-white origin-center transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
								/>
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
