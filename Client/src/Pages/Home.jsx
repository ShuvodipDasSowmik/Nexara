import { useNavigate } from "react-router-dom";
import Header from "../Components/SiteChrome/Header";
import Footer from "../Components/SiteChrome/Footer";

const features = [
    {
        title: "Upload PDFs",
        desc: "Easily upload your textbooks, notes, and study materials. Supported formats: PDF, DOCX.",
        icon: (
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-8m0 0l-4 4m4-4l4 4M4 20h16" />
            </svg>
        ),
    },
    {
        title: "Chapter Analysis",
        desc: "Let AI break down chapters and extract key concepts, summaries, and important points for you.",
        icon: (
            <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        ),
    },
    {
        title: "Question Generation",
        desc: "Generate practice questions from your study material instantly. Multiple choice, short answer, and more.",
        icon: (
            <svg className="w-7 h-7 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
        ),
    },
    {
        title: "AI Chat Assistant",
        desc: "Ask questions and get instant answers powered by RAG AI. Personalized, context-aware help.",
        icon: (
            <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
            </svg>
        ),
    },
    {
        title: "Dashboard",
        desc: "Track your uploaded documents, generated questions, and progress in one place.",
        icon: (
            <svg className="w-7 h-7 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6v6H9z" />
            </svg>
        ),
    },
    {
        title: "Tools",
        desc: "Access extra utilities for document conversion, summarization, and more.",
        icon: (
            <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} />
            </svg>
        ),
    },
];

const Home = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900">
            <main className="flex-1 flex flex-col items-center justify-start px-4 pt-16 pb-8 relative">
                <div className="absolute inset-0 pointer-events-none z-0">
                    <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-tr from-blue-600/30 via-purple-600/20 to-transparent rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-56 h-56 bg-gradient-to-tr from-purple-600/30 via-blue-600/20 to-transparent rounded-full blur-2xl"></div>
                </div>
                <section className="relative z-10 w-full max-w-3xl mx-auto">
                    <div className="bg-gray-900/80 rounded-2xl shadow-xl border border-gray-700/60 p-8 mb-8 backdrop-blur-md">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight text-center">
                            Nexara
                        </h1>
                        <p className="text-lg md:text-xl text-gray-300 mb-6 text-center">
                            Your Context Aware Study Buddy
                        </p>
                        <div className="flex justify-center mb-4">
                            <button
                                onClick={() => navigate("/signup")}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </section>
                <section className="relative z-10 w-full max-w-5xl mx-auto mt-2">
                    <h2 className="text-2xl font-bold text-white mb-6 text-center">Platform Features</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        {features.map((f, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 bg-gray-800/70 rounded-xl p-6 shadow hover:bg-gray-800/90 transition">
                                <div>{f.icon}</div>
                                <div className="font-semibold text-white text-lg mb-1 text-center">{f.title}</div>
                                <div className="text-gray-300 text-sm text-center">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="relative z-10 w-full max-w-3xl mx-auto mt-12">
                    <div className="bg-gray-900/70 rounded-xl p-6 shadow border border-gray-700/40 text-gray-200 text-center">
                        <h3 className="text-xl font-bold mb-2 text-white">Why Nexara?</h3>
                        <p className="mb-2">Nexara uses Retrieval-Augmented Generation (RAG) to bring you the most relevant answers and study support, tailored to your uploaded materials.</p>
                        <p className="mb-2">Our AI understands your documents, generates questions, and helps you study smarter, not harder.</p>
                        <p className="mb-2">Join students and educators who are transforming their learning experience with Nexara.</p>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default Home;
