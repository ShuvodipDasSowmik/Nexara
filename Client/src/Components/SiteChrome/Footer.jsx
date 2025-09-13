import { FaFacebook, FaGithub } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const contributors = [
    {
        name: 'Shuvodip Das Sowmik',
        facebook: 'https://www.facebook.com/d.sowmik',
        github: 'https://github.com/ShuvodipDasSowmik',
    },
    {
        name: 'Md. Kaisarul Islam Estey',
        facebook: 'https://www.facebook.com/skie.shahkaisarul.islamestey',
        github: 'https://github.com/Estey144',
    },
];

const Footer = () => {
    const navigate = useNavigate();
    return (
        <footer className="w-full bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 border-t border-gray-800 shadow-lg backdrop-blur-md z-30 mt-12 relative">
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center">
                {/* Left: Brand & About Us */}
                <div className="flex flex-col items-start mb-6 md:mb-0">
                    <span className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text animate-gradient-x mb-2">
                        Nexara
                    </span>
                    <span className="text-xs text-gray-300 mb-4">
                        AI-powered Retrieval-Augmented Generation for smarter studying
                    </span>
                    <button
                        onClick={() => navigate('/about')}
                        className="bg-gray-800 text-blue-300 px-4 py-2 rounded-lg shadow hover:bg-gray-700 hover:text-blue-400 transition-colors text-sm font-semibold border border-blue-700"
                    >
                        About Us
                    </button>
                </div>
                {/* Right: Contributors */}
                <div className="flex flex-col items-center md:items-end">
                    <h3 className="text-lg font-semibold text-blue-200 mb-2 border-b-2 border-blue-500 w-fit self-start md:self-end">Contributors</h3>
                    <div className="flex gap-4">
                        {contributors.map((dev, idx) => (
                            <div key={idx} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 border border-gray-700 rounded-xl shadow-lg p-4 min-w-[140px] flex flex-col items-center">
                                <span className="text-sm font-medium text-white mb-2">{dev.name}</span>
                                <div className="flex gap-3 mt-1 justify-start w-full">
                                    <a href={dev.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600">
                                        <FaFacebook size={20} />
                                    </a>
                                    <a href={dev.github} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-100">
                                        <FaGithub size={20} />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 blur-lg opacity-30"></div>
            <hr className="border-gray-700 mx-6" />
            <div className="w-full text-center text-xs text-gray-400 py-2 pb-8">
                &copy; {new Date().getFullYear()} Nexara. All rights reserved.
            </div>
        </footer>
    );
};

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
