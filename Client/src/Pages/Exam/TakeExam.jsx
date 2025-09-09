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
    setError('');
    setResult(null);
    try {
      const payload = Object.entries(answers).map(([questionId, selected]) => ({ questionId: Number(questionId), selected }));
      const res = await API.post(`/exam/${examId}/submit`, payload);
      setResult(res.data);
      setShowScoreModal(true);
    } catch (err) {
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
      {result && showScoreModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowScoreModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-gray-700 bg-gray-900 text-gray-100 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-2">Exam evaluated</h3>
            <p className="text-gray-300 mb-4">You scored</p>
            <div className="text-3xl font-extrabold mb-4">
              {result.score} <span className="text-gray-400 text-xl">/ {result.total}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-gray-800"
                onClick={() => setShowScoreModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
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
