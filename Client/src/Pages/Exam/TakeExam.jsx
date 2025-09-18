import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../API/axios';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { [questionId]: 'A' | 'B' | 'C' | 'D' }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { score, total, details: [{ questionId, isCorrect, correctAnswer, selected }] }
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showForbiddenModal, setShowForbiddenModal] = useState(false);
  const [showEvaluationAnimation, setShowEvaluationAnimation] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    API.get(`/exam/${examId}/questions`)
      .then(res => {
        if (!active) return;
        setQuestions(res.data || []);
      })
      .catch(err => {
        if (!active) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to load questions.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [examId]);

  const total = questions.length;
  const answeredCount = useMemo(() => {
    return Object.entries(answers).filter(([questionId, answer]) => {
      const question = questions.find(q => q.id === parseInt(questionId));
      if (!question) return false;
      
      if (question.questionType === 'subjective') {
        // For subjective questions, check if answer is not empty
        return answer && answer.trim().length > 0;
      } else {
        // For multiple choice, just check if an option is selected
        return answer && answer.length > 0;
      }
    }).length;
  }, [answers, questions]);

  const setAnswer = (qid, value) => setAnswers(a => ({ ...a, [qid]: value }));

  const submit = async () => {
    setSubmitting(true);
    setShowEvaluationAnimation(true);
    setError('');
    setResult(null);
    try {
      const payload = Object.entries(answers).map(([questionId, selected]) => ({ questionId: Number(questionId), selected }));
      const res = await API.post(`/exam/${examId}/submit`, payload);
      
      // Keep animation visible for at least 2 seconds to show the nice animation
      const minAnimationTime = 2000;
      const startTime = Date.now();
      
      setResult(res.data);
      
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minAnimationTime - elapsedTime);
      
      setTimeout(() => {
        setShowEvaluationAnimation(false);
        setShowScoreModal(true);
      }, remainingTime);
      
    } catch (err) {
      setShowEvaluationAnimation(false);
      if (err?.response?.status === 403) {
        setShowForbiddenModal(true);
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to submit answers.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-4xl rounded-2xl shadow-xl border border-gray-700/60 bg-gradient-to-br from-gray-900/80 to-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Exam #{examId}</h1>
            <div className="text-xs text-gray-400">{total} questions</div>
          </div>

          {loading && <div className="text-gray-300">Loading questions...</div>}
          {error && <div className="text-red-400">{error}</div>}

          {!loading && !error && (
            <>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800/70">
                    <div className="text-white font-semibold mb-2">
                      {idx + 1}. {q.questionText}
                    </div>
                    
                    {q.questionType === 'subjective' ? (
                      // Subjective Question - Text Area
                      <div className="space-y-2">
                        <textarea
                          className="w-full p-3 rounded bg-gray-900/70 text-gray-100 border border-gray-700 min-h-[120px] placeholder-gray-400"
                          placeholder="Type your detailed answer here..."
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswer(q.id, e.target.value)}
                          disabled={!!result}
                        />
                        {!!result && (
                          <div className="mt-2 text-sm">
                            {(() => {
                              const d = result?.details?.find(detail => detail.questionId === q.id);
                              if (!d) return null;
                              const score = d.correctAnswer; // For subjective, this contains the score
                              return (
                                <div className={d.isCorrect ? 'text-green-400' : 'text-yellow-400'}>
                                  <div className="font-semibold">Score: {score}</div>
                                  {d.isCorrect ? 'Excellent answer!' : 'Good effort! Review the topic for improvement.'}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Multiple Choice Question - Radio Buttons
                      <div className="space-y-2 text-gray-200">
                        {(['A','B','C','D']).map(letter => {
                          const key = `option${letter}`;
                          const val = letter;
                          const selected = answers[q.id] === val;
                          const showGrading = !!result;
                          const detail = result?.details?.find(d => d.questionId === q.id);
                          const isThisCorrect = showGrading ? (detail?.correctAnswer?.toUpperCase?.() === val.toUpperCase()) : undefined;
                          const isThisSelected = selected;
                          const border = showGrading
                            ? isThisCorrect
                              ? 'border-green-500'
                              : isThisSelected && !detail?.isCorrect
                                ? 'border-red-500'
                                : 'border-gray-700'
                            : 'border-gray-700';
                          return (
                            <label key={key} className={`flex items-center gap-2 cursor-pointer border ${border} rounded-md p-2 bg-gray-800/60 hover:bg-gray-800/80`}>
                              <input
                                type="radio"
                                name={`q-${q.id}`}
                                checked={selected}
                                onChange={() => setAnswer(q.id, val)}
                                className="accent-blue-500"
                                disabled={!!result}
                              />
                              <span>
                                <span className="text-blue-300 mr-2">{letter}.</span>
                                {q[key]}
                              </span>
                            </label>
                          );
                        })}
                        {!!result && (
                          <div className="mt-2 text-sm">
                            {(() => {
                              const d = result?.details?.find(detail => detail.questionId === q.id);
                              if (!d) return null;
                              const selectedLetter = answers[q.id];
                              const correctLetter = String(d.correctAnswer || '').toUpperCase();
                              const isSelectedCorrect = String(selectedLetter || '').toUpperCase() === correctLetter;
                              return (
                                <div className={isSelectedCorrect ? 'text-green-400' : 'text-red-400'}>
                                  {isSelectedCorrect ? 'Correct' : (
                                    <>
                                      Wrong. Correct answer is <span className="font-semibold text-green-400">{correctLetter}</span>.
                                    </>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {result
                    ? `Score: ${result.score}/${result.total}`
                    : `${answeredCount}/${total} answered`}
                </div>
                {!result ? (
                  <button
                    type="button"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
                    disabled={submitting || total === 0 || answeredCount !== total}
                    onClick={submit}
                  >
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                ) : (
                  <div className="px-3 py-1 rounded bg-gray-800/70 text-gray-200 border border-gray-700">Evaluation complete</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Evaluation Animation Modal */}
      {showEvaluationAnimation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/95 to-gray-800/95 text-gray-100 p-8 shadow-2xl text-center">
            
            {/* Main Animation Container */}
            <div className="mb-6">
              {/* Animated Exam Paper Icon */}
              <div className="relative mx-auto w-20 h-20 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl animate-pulse">
                  <div className="w-full h-full bg-gray-900/20 rounded-xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                
                {/* Rotating Circle */}
                <div className="absolute -inset-2">
                  <div className="w-full h-full border-4 border-transparent border-t-blue-400 border-r-purple-400 rounded-full animate-spin"></div>
                </div>
              </div>
              
              {/* Animated Title */}
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Evaluating Your Exam
              </h3>
              
              {/* Animated Subtitle */}
              <p className="text-gray-300 mb-4">
                Our AI is carefully reviewing your answers...
              </p>
            </div>
            
            {/* Progress Indicators */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Processing answers</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-0"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-150"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse animation-delay-300"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Calculating scores</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-500"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-650"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse animation-delay-800"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Generating report</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse animation-delay-1000"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse animation-delay-1150"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse animation-delay-1300"></div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse" style={{width: '75%'}}></div>
            </div>
            
            {/* Encouraging Message */}
            <p className="text-xs text-gray-400 italic">
              This may take a few moments. Please wait while we prepare your results...
            </p>
          </div>
        </div>
      )}
      
      {result && showScoreModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowScoreModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6 shadow-2xl animate-pulse"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-3 animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                Evaluation Complete!
              </h3>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-300 mb-4">Your final score is:</p>
              <div className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {result.score} <span className="text-gray-400 text-2xl">/ {result.total}</span>
              </div>
              <div className="text-lg text-gray-300">
                {Math.round((result.score / result.total) * 100)}% Score
              </div>
              
              {/* Performance Badge */}
              <div className="mt-4">
                {(() => {
                  const percentage = (result.score / result.total) * 100;
                  if (percentage >= 90) {
                    return <div className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-sm font-semibold">🏆 Excellent!</div>;
                  } else if (percentage >= 80) {
                    return <div className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-semibold">🎉 Great Job!</div>;
                  } else if (percentage >= 70) {
                    return <div className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-semibold">👍 Good Work!</div>;
                  } else if (percentage >= 60) {
                    return <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold">📚 Keep Learning!</div>;
                  } else {
                    return <div className="inline-block px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full text-sm font-semibold">💪 Try Again!</div>;
                  }
                })()}
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                className="px-6 py-2 rounded-lg border border-gray-600 hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
                onClick={() => setShowScoreModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                onClick={() => navigate(`/exam/${examId}/summary`)}
              >
                View Summary
              </button>
            </div>
          </div>
        </div>
      )}
      {showForbiddenModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowForbiddenModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 text-gray-100 p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2">Exam Already Attempted</h3>
            <p className="text-gray-300 mb-4">You have already given this exam. You cannot retake it.</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-700 bg-blue-600 text-white font-semibold hover:bg-blue-700"
                onClick={() => navigate('/')}
              >
                Go Back to Homepage
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TakeExam;
