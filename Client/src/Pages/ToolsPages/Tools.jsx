import React from "react";
import PDFParser from "../../Components/PDFParser/PDFParser";
import StartExam from "../../Components/Exam/StartExam";

const Tools = () => {
    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-10 px-2 min-h-screen">
            {/* Hero Section */}
            <section className="w-full max-w-3xl mx-auto mb-10 text-center relative">
                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                    <div className="w-72 h-32 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-transparent blur-2xl rounded-full mx-auto"></div>
                </div>
                <h1 className="relative text-4xl md:text-5xl font-extrabold text-white mb-3 z-10">
                    Nexara Tools
                </h1>
                <p className="relative text-lg text-gray-300 mb-2 z-10">
                    Upload PDFs and generate custom exams with AI
                </p>
            </section>
            
            {/* Tools Section */}
            <div className="w-full flex flex-col items-center gap-6">
                <PDFParser className="w-full" />
                <StartExam />
            </div>
        </div>
    );
};

export default Tools;