import React from 'react';
import PDFParser from '../../Components/PDFParser/PDFParser';
import StartExam from '../../Components/Exam/StartExam';

const Tools = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Study Tools</h1>
          <p className="text-gray-400 text-lg">Upload PDFs and generate custom exams with AI</p>
        </div>

        {/* Grid Layout - Always 2 columns on large devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PDF Parser Component */}
          <div className="w-full">
            <PDFParser />
          </div>

          {/* Start Exam Component */}
          <div className="w-full">
            <StartExam />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tools;
