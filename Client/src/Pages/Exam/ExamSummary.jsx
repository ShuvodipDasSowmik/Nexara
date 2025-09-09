import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../API/axios';

const ExamSummary = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await API.get(`/exam/${examId}/summary`);
        setSummary(response.data);
      } catch (err) {
        console.error('Error fetching exam summary:', err);
        setError(err?.response?.data?.message || err?.message || 'Failed to load exam summary.');
      } finally {
        setLoading(false);
      }
    };

    if (examId) {
      fetchSummary();
    }
  }, [examId]);

  const getOptionLabel = (optionLetter) => {
    switch (optionLetter?.toUpperCase()) {
      case 'A': return 'A';
      case 'B': return 'B';
      case 'C': return 'C';
      case 'D': return 'D';
      default: return optionLetter;
    }
  };

  const getGradeColor = () => {
    if (!summary?.percentage) return 'text-gray-400';
    if (summary.percentage >= 90) return 'text-green-400';
    if (summary.percentage >= 80) return 'text-blue-400';
    if (summary.percentage >= 70) return 'text-yellow-400';
    if (summary.percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getGradeText = () => {
    if (!summary?.percentage) return 'N/A';
    if (summary.percentage >= 90) return 'Excellent';
    if (summary.percentage >= 80) return 'Very Good';
    if (summary.percentage >= 70) return 'Good';
    if (summary.percentage >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
          <div className="text-gray-200 font-medium">Loading exam summary...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-red-400 text-lg font-semibold mb-4">Error</div>
          <div className="text-gray-300 mb-6">{error}</div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="text-gray-300 text-center">No summary available.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-gray-700/60 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{summary.title}</h1>
              <p className="text-gray-400">{summary.description}</p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition"
            >
              Back to Home
            </button>
          </div>
          
          {/* Score Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/60 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{summary.score}</div>
              <div className="text-sm text-gray-400">Score</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{summary.totalQuestions}</div>
              <div className="text-sm text-gray-400">Total Questions</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-4 text-center">
              <div className={`text-2xl font-bold ${getGradeColor()}`}>
                {summary.percentage?.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Percentage</div>
            </div>
            <div className="bg-gray-800/60 rounded-lg p-4 text-center">
              <div className={`text-lg font-bold ${getGradeColor()}`}>
                {getGradeText()}
              </div>
              <div className="text-sm text-gray-400">Grade</div>
            </div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl border border-gray-700/60 p-6">
          <h2 className="text-xl font-bold text-white mb-6">Question Review</h2>
          
          <div className="space-y-6">
            {summary.questions?.map((question, index) => (
              <div key={question.questionId} className="border border-gray-700 rounded-lg p-4 bg-gray-800/40">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-white font-semibold flex-1">
                    {index + 1}. {question.questionText}
                  </h3>
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${
                    question.isCorrect 
                      ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                      : 'bg-red-600/20 text-red-400 border border-red-600/30'
                  }`}>
                    {question.questionType === 'subjective' ? 
                      (question.isCorrect ? 'Good Answer' : 'Needs Improvement') :
                      (question.isCorrect ? 'Correct' : 'Incorrect')
                    }
                  </div>
                </div>
                
                {question.questionType === 'subjective' ? (
                  // Subjective Question Display
                  <div className="space-y-3">
                    <div className="bg-gray-900/40 rounded p-3">
                      <div className="text-sm text-gray-400 mb-2">Your Answer:</div>
                      <div className="text-gray-200 whitespace-pre-wrap">
                        {question.userAnswer || 'No answer provided'}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-blue-300">Score:</span> 
                      <span className={`ml-2 font-semibold ${
                        question.isCorrect ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {question.correctAnswer}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Multiple Choice Question Display
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {[
                        { letter: 'A', text: question.optionA },
                        { letter: 'B', text: question.optionB },
                        { letter: 'C', text: question.optionC },
                        { letter: 'D', text: question.optionD }
                      ].map(option => {
                        const isCorrect = option.letter === question.correctAnswer?.toUpperCase();
                        const isUserAnswer = option.letter === question.userAnswer?.toUpperCase();
                        
                        let classes = 'p-2 rounded border ';
                        if (isCorrect) {
                          classes += 'border-green-500 bg-green-600/10 text-green-300';
                        } else if (isUserAnswer && !question.isCorrect) {
                          classes += 'border-red-500 bg-red-600/10 text-red-300';
                        } else {
                          classes += 'border-gray-700 bg-gray-800/40 text-gray-300';
                        }
                        
                        return (
                          <div key={option.letter} className={classes}>
                            <span className="font-semibold text-blue-300 mr-2">{option.letter}.</span>
                            {option.text}
                            {isCorrect && (
                              <span className="ml-2 text-green-400 text-sm">✓ Correct</span>
                            )}
                            {isUserAnswer && !isCorrect && (
                              <span className="ml-2 text-red-400 text-sm">✗ Your answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {!question.isCorrect && (
                      <div className="text-sm text-gray-400">
                        <span className="font-semibold">Your answer:</span> {getOptionLabel(question.userAnswer)} • 
                        <span className="font-semibold ml-2">Correct answer:</span> {getOptionLabel(question.correctAnswer)}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSummary;
