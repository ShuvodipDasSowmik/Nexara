import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../API/axios';

const SubjectiveResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // For now, we'll get results from localStorage since we need to implement backend storage
    // In a real implementation, you'd fetch from the server
    const storedResults = localStorage.getItem(`subjective_results_${examId}`);
    if (storedResults) {
      try {
        setResults(JSON.parse(storedResults));
      } catch (err) {
        setError('Failed to load results');
      }
    } else {
      setError('No results found for this exam');
    }
    setLoading(false);
  }, [examId]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGradeColor = (grade) => {
    if (grade === 'A' || grade === 'A+') return 'text-green-400';
    if (grade === 'B' || grade === 'B+') return 'text-blue-400';
    if (grade === 'C' || grade === 'C+') return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
          <div className="text-gray-200 font-medium">Loading results...</div>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error || 'Results not found'}</div>
          <button
            onClick={() => navigate('/tools')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Tools
          </button>
        </div>
      </div>
    );
  }

  const { questions, answers, evaluations, overallScore, overallGrade } = results;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Subjective Exam Results</h1>
          <p className="text-gray-400">Your performance summary and detailed feedback</p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl border border-gray-600 p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Overall Performance</h2>
            <div className="flex justify-center items-center gap-8">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </div>
                <div className="text-gray-300 text-sm">Average Score</div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getGradeColor(overallGrade)}`}>
                  {overallGrade}
                </div>
                <div className="text-gray-300 text-sm">Overall Grade</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400">
                  {questions.length}
                </div>
                <div className="text-gray-300 text-sm">Questions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-6">
          {questions.map((question, index) => {
            const answer = answers[question.id];
            const evaluation = evaluations[question.id];
            
            return (
              <div key={question.id} className="bg-gray-800/60 rounded-xl border border-gray-700 p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Question {index + 1}
                  </h3>
                  <p className="text-gray-200 leading-relaxed mb-4">
                    {question.questionText}
                  </p>
                </div>

                {/* Student Answer */}
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-300 mb-2">Your Answer:</h4>
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                    <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {answer}
                    </p>
                  </div>
                </div>

                {/* Evaluation */}
                {evaluation && (
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                    <h4 className="text-lg font-medium text-gray-300 mb-3">AI Evaluation:</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-300">Score:</span>
                        <span className={`text-xl font-bold ${getScoreColor(evaluation.score)}`}>
                          {/* Show both scaled (0-10) and raw percent if available */}
                          {evaluation.scaledScore !== undefined ? `${evaluation.scaledScore}/10` : `${evaluation.score}%`}
                        </span>
                        <span className="text-gray-300">Grade:</span>
                        <span className={`text-lg font-bold ${getGradeColor(evaluation.grade)}`}>
                          {evaluation.grade}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-300 text-sm font-medium">Detailed Feedback:</span>
                        <p className="text-gray-200 mt-1 leading-relaxed">
                          {evaluation.feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => navigate('/tools')}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
          >
            Back to Tools
          </button>
          <button
            onClick={() => navigate('/user/dashboard')}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubjectiveResults;
