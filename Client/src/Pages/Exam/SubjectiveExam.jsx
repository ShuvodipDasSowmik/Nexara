import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../API/axios';

const SubjectiveExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'answer_text' }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // { [questionId]: { score, feedback, grade } }
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '', isRetryable: false });

  const showAIErrorModal = (errorMessage, isRetryable = true) => {
    let title = 'AI Evaluation Failed';
    let message = 'There was an issue with AI evaluation. Please try again.';
    
    if (errorMessage.includes('rate limit') || errorMessage.includes('temporarily unavailable')) {
      title = 'AI Service Temporarily Unavailable';
      message = 'The AI evaluation service is currently experiencing high demand. Please wait a few minutes and try again.';
    } else if (errorMessage.includes('technical issue') || errorMessage.includes('invalid response')) {
      title = 'AI Service Error';
      message = 'The AI evaluation service encountered a technical issue. Please try again later or contact support if the problem persists.';
    } else if (errorMessage.includes('failed due to a technical issue')) {
      title = 'Evaluation Service Error';
      message = 'Essay evaluation failed due to a technical issue. Please try again later or contact support.';
    }
    
    setErrorModalContent({ title, message, isRetryable });
    setShowErrorModal(true);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    API.get(`/exam/${examId}/questions`)
      .then(res => {
        if (!active) return;
        const examQuestions = res.data || [];
        // Filter only subjective questions
        const subjectiveQuestions = examQuestions.filter(q => q.questionType === 'subjective');
        setQuestions(subjectiveQuestions);
        
        if (subjectiveQuestions.length === 0) {
          setError('No subjective questions found in this exam.');
        }
      })
      .catch(err => {
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load questions.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [examId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitAnswer = async (questionId) => {
    const answer = answers[questionId];
    if (!answer || answer.trim().length === 0) {
      alert('Please provide an answer before submitting.');
      return;
    }

    if (answer.trim().length < 30) {
      alert('Please provide a more detailed answer (at least 30 characters) for proper evaluation.');
      return;
    }

    setEvaluating(true);
    try {
      const question = questions.find(q => q.id === questionId);
      const response = await API.post('/exam/evaluate-essay', {
        topic: question.questionText,
        essay: answer
      });

      // Store raw and scaled scores locally so UI can show consistent values
      const rawScore = response.data.score || 0;
      const scaledScore = Math.round(rawScore / 10.0);
      setResults(prev => ({
        ...prev,
        [questionId]: {
          score: rawScore,
          scaledScore: scaledScore,
          feedback: response.data.feedback,
          grade: response.data.grade
        }
      }));

      // Move to next question if available
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to evaluate answer';
      
      showAIErrorModal(errorMessage, true);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSubmitAllAnswers = async () => {
    const unansweredQuestions = questions.filter(q => !answers[q.id] || answers[q.id].trim().length === 0);
    if (unansweredQuestions.length > 0) {
      alert(`Please answer all questions before submitting. ${unansweredQuestions.length} questions remaining.`);
      return;
    }

    // Check if all answers are properly evaluated with detailed validation
    const unevaluatedQuestions = questions.filter(q => {
      const result = results?.[q.id];
      return !result || typeof result.score !== 'number' || result.score < 0;
    });
    
    if (unevaluatedQuestions.length > 0) {
      const questionNumbers = unevaluatedQuestions.map((q, index) => 
        questions.findIndex(quest => quest.id === q.id) + 1
      ).join(', ');
      
      showAIErrorModal(
        `Please evaluate all your answers individually before submitting the complete exam. Questions ${questionNumbers} need proper evaluation.`,
        false
      );
      return;
    }

    // Additional validation: ensure all scores are reasonable
    const invalidScores = Object.entries(results).filter(([questionId, result]) => {
      return !result || typeof result.score !== 'number' || result.score < 0 || result.score > 100;
    });
    
    if (invalidScores.length > 0) {
      console.error('Invalid scores detected:', invalidScores);
      showAIErrorModal(
        'Some evaluations appear to be invalid. Please re-evaluate your answers before submitting.',
        false
      );
      return;
    }

    setSubmitting(true);
    try {
      // Debug logging for score calculation
      console.log('=== SUBMISSION DEBUG ===');
      console.log('Results:', results);
      
      const scoreDetails = Object.entries(results).map(([questionId, result]) => {
        const raw = result?.score || 0;
        const scaled = Math.round(raw / 10.0);
        console.log(`Question ${questionId}: raw=${raw}, scaled=${scaled}`);
        return { questionId, raw, scaled };
      });
      
      const totalScaledScore = scoreDetails.reduce((sum, detail) => sum + detail.scaled, 0);
      const maxScaledPossible = questions.length * 10; // each question 0-10
      const overallPercentage = maxScaledPossible > 0 ? (totalScaledScore * 100.0 / maxScaledPossible) : 0.0;
      
      console.log(`Total scaled score: ${totalScaledScore}/${maxScaledPossible} = ${overallPercentage}%`);
      console.log('========================');

      // Format the submission with the actual essay content and evaluation results
      const formattedAnswers = questions.map(question => ({
        questionId: question.id,
        selected: JSON.stringify({
          essay: answers[question.id],
          score: results[question.id]?.score || 0, // raw 0-100
          scaledScore: Math.round((results[question.id]?.score || 0) / 10.0), // scaled 0-10
          grade: results[question.id]?.grade || 'F',
          feedback: results[question.id]?.feedback || ''
        })
      }));

      await API.post(`/exam/${examId}/submit`, formattedAnswers);

      // Store results for display with correct percentage calculation
      const examResults = {
        examId: examId,
        questions: questions,
        answers: answers,
        evaluations: results,
        overallScore: Math.round(overallPercentage),
        overallGrade: getLetterGrade(overallPercentage),
        submittedAt: new Date().toISOString()
      };

      localStorage.setItem(`subjective_results_${examId}`, JSON.stringify(examResults));

      navigate(`/exam/${examId}/subjective-results`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit exam';
      
      if (errorMessage.includes('evaluate your answers individually')) {
        alert('Please evaluate all your answers individually before submitting the complete exam. Some answers may not have been properly evaluated.');
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('temporarily unavailable')) {
        alert('Submission failed due to AI evaluation being temporarily unavailable. Please ensure all answers are evaluated individually first.');
      } else {
        alert('Failed to submit exam: ' + errorMessage + '. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getLetterGrade = (score) => {
    if (score >= 97) return 'A+';
    if (score >= 93) return 'A';
    if (score >= 90) return 'A-';
    if (score >= 87) return 'B+';
    if (score >= 83) return 'B';
    if (score >= 80) return 'B-';
    if (score >= 77) return 'C+';
    if (score >= 73) return 'C';
    if (score >= 70) return 'C-';
    if (score >= 67) return 'D+';
    if (score >= 65) return 'D';
    return 'F';
  };

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
          <div className="text-gray-200 font-medium">Loading subjective exam...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
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

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).filter(qId => answers[qId] && answers[qId].trim().length > 0).length;
  const evaluatedCount = results ? Object.keys(results).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Subjective Exam</h1>
          <p className="text-gray-400">Answer the questions below. Your responses will be evaluated by AI.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress: {answeredCount}/{totalQuestions} answered</span>
            <span>Evaluated: {evaluatedCount}/{totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-full text-sm font-semibold transition-all duration-200 ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[questions[index]?.id]
                    ? results && results[questions[index]?.id]
                      ? 'bg-green-600 text-white'
                      : 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Current Question */}
        {currentQuestion && (
          <div className="bg-gray-800/60 rounded-xl border border-gray-700 p-6 mb-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </h2>
              <p className="text-gray-200 leading-relaxed">
                {currentQuestion.questionText}
              </p>
            </div>

            {/* Answer Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Answer:
              </label>
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Write your detailed answer here..."
                className="w-full h-40 p-4 bg-gray-900/70 text-gray-100 border border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={results && results[currentQuestion.id]}
              />
              <div className="text-xs text-gray-400 mt-1">
                {answers[currentQuestion.id] ? answers[currentQuestion.id].length : 0} characters
              </div>
            </div>

            {/* Submit Button for Individual Question */}
            {(!results || !results[currentQuestion.id]) && (
              <div className="mb-4">
                <button
                  onClick={() => handleSubmitAnswer(currentQuestion.id)}
                  disabled={evaluating || !answers[currentQuestion.id] || answers[currentQuestion.id].trim().length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
                >
                  {evaluating ? 'Evaluating...' : 'Submit & Evaluate Answer'}
                </button>
              </div>
            )}

            {/* Show Results for Current Question */}
            {results && results[currentQuestion.id] && (
              <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-2">Evaluation Results</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-300">Score:</span>
                    <span className={`text-xl font-bold ${getScoreColor(results[currentQuestion.id].score)}`}>
                      {results[currentQuestion.id].score}%
                    </span>
                    <span className="text-gray-300">Grade:</span>
                    <span className={`text-lg font-bold ${getGradeColor(results[currentQuestion.id].grade)}`}>
                      {results[currentQuestion.id].grade}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-300 text-sm">Feedback:</span>
                    <p className="text-gray-200 mt-1 leading-relaxed">
                      {results[currentQuestion.id].feedback}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === questions.length - 1}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        {/* Submit All Button */}
        {answeredCount === totalQuestions && evaluatedCount === totalQuestions && (
          <div className="text-center">
            <button
              onClick={handleSubmitAllAnswers}
              disabled={submitting}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting Exam...' : 'Submit Complete Exam'}
            </button>
          </div>
        )}

        {/* Message when not all answers are evaluated */}
        {answeredCount === totalQuestions && evaluatedCount < totalQuestions && (
          <div className="text-center">
            <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4 mb-4">
              <p className="text-yellow-200 font-medium">
                Please evaluate all your answers individually before submitting the complete exam.
              </p>
              <p className="text-yellow-300 text-sm mt-1">
                {evaluatedCount}/{totalQuestions} answers evaluated
              </p>
            </div>
          </div>
        )}
      </div>

      {/* AI Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800/95 backdrop-blur-sm border border-red-500/30 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">
                {errorModalContent.title}
              </h3>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                {errorModalContent.message}
              </p>
              
              <div className="flex flex-col gap-3">
                {errorModalContent.isRetryable && (
                  <button
                    onClick={() => {
                      setShowErrorModal(false);
                      // Auto-retry after modal closes
                      setTimeout(() => {
                        const currentQuestion = questions[currentQuestionIndex];
                        if (currentQuestion && answers[currentQuestion.id]) {
                          handleSubmitAnswer(currentQuestion.id);
                        }
                      }, 500);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </button>
                )}
                
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Close
                </button>
              </div>
              
              {errorModalContent.isRetryable && (
                <div className="mt-4 text-sm text-gray-400">
                  💡 <strong>Tip:</strong> You can also try evaluating your answer again manually using the "Evaluate Answer" button.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(evaluating || submitting) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
            <div className="text-gray-200 font-medium">
              {evaluating ? 'Evaluating your answer...' : 'Submitting exam...'}
            </div>
            <div className="text-gray-400 text-sm">Please wait while AI processes your response.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectiveExam;
