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

    setEvaluating(true);
    try {
      const question = questions.find(q => q.id === questionId);
      const response = await API.post('/exam/evaluate-essay', {
        topic: question.questionText,
        essay: answer
      });

      setResults(prev => ({
        ...prev,
        [questionId]: {
          score: response.data.score,
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
      alert('Failed to evaluate answer. Please try again.');
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

    setSubmitting(true);
    try {
      // Evaluate all unevaluated answers
      const unevaluatedQuestions = questions.filter(q => !results || !results[q.id]);
      let updatedResults = { ...results };
      
      for (const question of unevaluatedQuestions) {
        const answer = answers[question.id];
        try {
          const response = await API.post('/exam/evaluate-essay', {
            topic: question.questionText,
            essay: answer
          });

          updatedResults[question.id] = {
            score: response.data.score,
            feedback: response.data.feedback,
            grade: response.data.grade
          };
        } catch (error) {
          console.error(`Error evaluating question ${question.id}:`, error);
          // If evaluation fails, assign a default score
          updatedResults[question.id] = {
            score: 0,
            feedback: 'Error occurred during evaluation. Please try again.',
            grade: 'F'
          };
        }
      }

      // Update results state
      setResults(updatedResults);

      // Calculate overall score
      const totalScore = Object.values(updatedResults).reduce((sum, result) => sum + (result.score || 0), 0);
      const averageScore = questions.length > 0 ? totalScore / questions.length : 0;

      // For subjective exams, we'll format the submission to work with existing endpoint
      // We'll use the answer text as the "selected" value for subjective questions
      const formattedAnswers = questions.map(question => ({
        questionId: question.id,
        selected: `SUBJECTIVE:${averageScore.toFixed(1)}%` // Store the score in the selected field
      }));

      try {
        await API.post(`/exam/${examId}/submit`, formattedAnswers);
      } catch (submitError) {
        // Store results locally if submission fails
      }

      // Store results for display
      const examResults = {
        examId: examId,
        questions: questions,
        answers: answers,
        evaluations: updatedResults,
        overallScore: Math.round(averageScore),
        overallGrade: getLetterGrade(averageScore),
        submittedAt: new Date().toISOString()
      };

      localStorage.setItem(`subjective_results_${examId}`, JSON.stringify(examResults));

      navigate(`/exam/${examId}/subjective-results`);
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert('Failed to submit exam. Please try again.');
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
        {answeredCount === totalQuestions && (
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
      </div>

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
