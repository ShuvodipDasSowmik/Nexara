import React, { useEffect, useState } from 'react';
import { useAuth } from '../../Context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../../API/axios';

const StartExam = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState('AI Generated Exam');
  const [description, setDescription] = useState('Created from topic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!user || !user.id) throw new Error('User not logged in or missing ID');
      const payload = { inputText, title, description, studentId: user.id };
      const res = await API.post('/exam/generate', payload);
      const examId = res?.data?.examId;
      if (!examId) throw new Error('No examId returned');
      navigate(`/exam/${examId}/take`);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to generate exam');
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
      {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
      <form onSubmit={handleGenerate} className="space-y-3">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Topic / Input Text</label>
          <textarea
            className="w-full p-2 rounded bg-gray-900/70 text-gray-100 border border-gray-700"
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
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
        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
        >
          {loading ? 'Generating…' : 'Generate & Take Exam'}
        </button>
      </form>
    </div>
  );
};

export default StartExam;
