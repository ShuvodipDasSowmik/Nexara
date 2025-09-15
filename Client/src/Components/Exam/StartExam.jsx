import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../API/axios';

const StartExam = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState('AI Generated Exam');
  const [description, setDescription] = useState('Created from topic');
  const [questionCount, setQuestionCount] = useState(3);
  const [examType, setExamType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [serviceError, setServiceError] = useState({ title: '', message: '', isRetryable: false });

  const showServiceErrorModal = (errorMessage, statusCode) => {
    let title = 'Service Unavailable';
    let message = 'The exam generation service is currently unavailable. Please try again later.';
    let isRetryable = true;

    if (statusCode === 500) {
      title = 'Server Error';
      message = 'Our exam generation service is experiencing technical difficulties. Our team has been notified and is working to resolve this issue. Please try again in a few minutes.';
    } else if (errorMessage.includes('AI service') || errorMessage.includes('OpenAI') || errorMessage.includes('rate limit')) {
      title = 'AI Service Temporarily Unavailable';
      message = 'The AI service is temporarily unavailable due to high demand or maintenance. Please try again in a few minutes.';
    } else if (errorMessage.includes('invalid AI response') || errorMessage.includes('invalid response')) {
      title = 'Content Processing Error';
      message = 'We encountered an issue processing your content. Please try with different content or try again later.';
    } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      title = 'Connection Issue';
      message = 'We\'re having trouble connecting to our services. Please check your internet connection and try again.';
    }

    setServiceError({ title, message, isRetryable });
    setShowServiceModal(true);
    setError(''); // Clear the text error since we're showing a modal
  };
  const navigate = useNavigate();
  const examTypeRef = useRef(null);

  useEffect(() => {
    console.log('user in StartExam:', user);
    console.log('user.studentId:', user?.studentId);
    
    // Debug information for authentication state
    if (user) {
      console.log('User object keys:', Object.keys(user));
      console.log('User authenticated:', !!user);
      console.log('Student ID present:', !!user.studentId);
    } else {
      console.log('No user object found - user not authenticated');
    }
    
  }, [user, location, navigate]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!user) {
        throw new Error('Please log in to generate an exam. You need to be authenticated to use this feature.');
      }
      
      if (!user.studentId) {
        throw new Error('Student profile not found. Please log out and log back in, or contact support if the issue persists.');
      }
      
      // Validate input text
      if (!inputText || inputText.trim().length < 10) {
        throw new Error('Please provide more content (at least 10 characters) to generate meaningful exam questions.');
      }

      // Require exam type selection
      if (!examType) {
        throw new Error('Please select an exam type (Multiple Choice or Subjective) before choosing the number of questions.');
      }
      
      const payload = { 
        inputText: inputText.trim(), 
        questionCount: questionCount, 
        examType: examType,
        title: title.trim(), 
        description: description.trim(), 
        studentId: user.studentId 
      };
      const res = await API.post('/exam/generate', payload);
      const examId = res?.data?.examId;
      if (!examId) throw new Error('No examId returned');
      
      // Redirect to appropriate interface based on exam type
      if (examType === 'subjective') {
        navigate(`/exam/${examId}/subjective`);
      } else {
        navigate(`/exam/${examId}/take`);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to generate exam';
      const statusCode = err?.response?.status;
      
      console.error('Exam generation error:', err);
      
      // Show service error modal instead of inline error text
      showServiceErrorModal(errorMessage, statusCode);
    } finally {
      setLoading(false);
    }
  };

  // Prevent background scroll when loading overlay is shown
  useEffect(() => {
    if (loading) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [loading]);

  // Prefill from navigation state when coming from dashboard (e.g., PDF -> Tools)
  useEffect(() => {
    const state = location?.state || {};
    if (state.inputText && typeof state.inputText === 'string') {
      setInputText(state.inputText);
    }
    if (state.title && typeof state.title === 'string') {
      setTitle(state.title);
    }
    if (state.description && typeof state.description === 'string') {
      setDescription(state.description);
    }
  }, [location?.state]);

  return (
    <div className="w-full max-w-3xl mx-auto mt-8 p-4 border border-gray-700 rounded-xl bg-gray-800/60 relative">
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3" />
            <div className="text-gray-200 font-medium">Generating exam…</div>
            <div className="text-gray-400 text-sm">Please wait, questions are in progress.</div>
          </div>
        </div>
      )}
      <h2 className="text-xl font-semibold text-white mb-3">Start an Exam</h2>
      {error && (
        <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-red-400 text-lg">❌</div>
            <div>
              <div className="text-red-400 font-semibold mb-1">Exam Generation Failed</div>
              <div className="text-red-300 text-sm leading-relaxed">{error}</div>
              {(error.includes('AI service') || error.includes('temporarily unavailable')) && (
                <div className="mt-2 text-red-200 text-xs">
                  💡 Tip: Try again in a few minutes or use different content if the problem persists.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <form onSubmit={handleGenerate} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Topic / Input Text</label>
          <textarea
            className="w-full p-2 rounded bg-gray-900/70 text-gray-100 border border-gray-700"
            rows={3}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (error) setError(''); // Clear error when user starts typing
            }}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Title (optional)</label>
            <input
              className="w-full p-2 rounded bg-gray-900/70 text-gray-100 border border-gray-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Description (optional)</label>
            <input
              className="w-full p-2 rounded bg-gray-900/70 text-gray-100 border border-gray-700"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Exam Type</label>
          <select
            aria-label="exam-type-select"
            ref={examTypeRef}
            className="w-full p-2 rounded bg-gray-900/70 text-gray-100 border border-gray-700"
            value={examType}
            onChange={(e) => {
              const val = e.target.value;
              setExamType(val);
              if (val === 'subjective') setQuestionCount(3);
              if (val === 'multiple_choice') setQuestionCount(5);
            }}
          >
            <option value="">Select exam type</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="subjective">Subjective (Essay Questions)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Number of Questions</label>
          {examType === '' ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setShowTypeModal(true)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowTypeModal(true); }}
              className="w-full p-2 rounded bg-gray-900/70 text-gray-400 border border-gray-700 cursor-pointer"
            >
              Select exam type first
            </div>
          ) : (
            <select
              ref={examTypeRef}
              className="w-full p-2 rounded bg-gray-900/70 text-gray-100 border border-gray-700"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
            >
              {examType === 'subjective' ? (
                <>
                  <option value={1}>1 Question</option>
                  <option value={2}>2 Questions</option>
                  <option value={3}>3 Questions</option>
                </>
              ) : (
                <>
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </>
              )}
            </select>
          )}
        </div>
        {showTypeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md mx-4 bg-gray-900 rounded-xl border border-gray-700 shadow-lg">
              <div className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Choose Exam Type</h3>
                <p className="text-sm text-gray-300 mb-4">You need to select an exam type before choosing how many questions to generate.</p>
                <div className="flex gap-2 justify-end">
                  <button
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500 text-white rounded-lg font-semibold shadow-lg hover:from-indigo-600 hover:via-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-4 focus:ring-cyan-400/30"
                    onClick={() => {
                      setShowTypeModal(false);
                      setTimeout(() => {
                        if (examTypeRef && examTypeRef.current) examTypeRef.current.focus();
                      }, 50);
                    }}
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Error Modal */}
        {showServiceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-red-500/30 shadow-2xl">
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {serviceError.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-6 leading-relaxed">
                    {serviceError.message}
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    {serviceError.isRetryable && (
                      <button
                        onClick={() => {
                          setShowServiceModal(false);
                          // Auto-retry after modal closes by calling handleGenerate directly
                          setTimeout(() => {
                            if (inputText.trim() && examType) {
                              // Create a synthetic event object for handleGenerate
                              const syntheticEvent = { 
                                preventDefault: () => {},
                                target: { form: true } // Mark as synthetic event
                              };
                              handleGenerate(syntheticEvent);
                            } else {
                              // If validation fails, just show the form errors normally
                              console.log('Cannot retry: missing input text or exam type');
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
                      onClick={() => setShowServiceModal(false)}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                    >
                      Close
                    </button>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-400">
                    💡 <strong>Tip:</strong> If the issue persists, try using shorter content or contact support.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate & Take Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartExam;
