const Footer = () => (
    <footer className="w-full bg-gradient-to-r from-blue-900 via-purple-900 to-gray-900 border-t border-gray-700/50 shadow-lg backdrop-blur-md z-30 mt-12 relative">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs font-semibold">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                Nexara &copy; {new Date().getFullYear()} &mdash; AI-powered Retrieval-Augmented Generation for smarter studying
            </span>
        </div>
        <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-lg opacity-30"></div>
    </footer>
);

// Add keyframes for gradient animation in your global CSS:
// .animate-gradient-x {
//   background-size: 200% 200%;
//   animation: gradient-x 4s ease infinite;
// }
// @keyframes gradient-x {
//   0%, 100% { background-position: left; }
//   50% { background-position: right; }
// }

export default Footer;
