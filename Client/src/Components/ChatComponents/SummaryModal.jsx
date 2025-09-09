import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MessageFormatter from './MessageFormatter';
import API from '../../API/axios';

// Track the last summary length for which summaryText was fetched
const SummaryModal = ({
  show,
  onClose,
  summaryText,
  isSummarizing,
  summaryLength,
  setSummaryLength,
  handleSummarize,
}) => {
  const navigate = useNavigate();
  const lastFetchedLength = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showWarning, setShowWarning] = useState(false);

  // Update lastFetchedLength when summaryText changes and not loading
  React.useEffect(() => {
    if (!isSummarizing && summaryText) {
      lastFetchedLength.current = summaryLength;
    }
    // If summaryLength changes, but summaryText is not for that length, reset lastFetchedLength
    if (!isSummarizing && !summaryText) {
      lastFetchedLength.current = null;
    }
  }, [summaryText, isSummarizing, summaryLength]);

  const handleGeneratePDF = async () => {
    setPdfLoading(true);
    setPdfUrl(null);
    try {
      const res = await API.post(
        '/tools/generate-pdf',
        new URLSearchParams({ content: summaryText }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          responseType: 'blob'
        }
      );
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      alert('Error generating PDF: ' + err.message);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = 'summary.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);
  };

  const handleTakeExam = () => {
    const hasValidSummary = summaryText && 
      summaryText.trim() !== '' && 
      !summaryText.includes('Rate limit reached') && 
      !summaryText.includes('Failed to fetch') &&
      !summaryText.includes('Error') &&
      summaryText !== 'Loading summary...';

    if (!hasValidSummary) {
      setShowWarning(true);
      return;
    }
    
    let examContent = summaryText;
    examContent = examContent.trim().replace(/\s+/g, ' ');
    
    navigate('/tools', { 
      state: { 
        inputText: examContent,
        title: 'Exam from Chat Summary',
        description: 'Generated from summarized chat conversation'
      } 
    });
    onClose();
  };

  return show ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full shadow-2xl flex flex-col overflow-y-auto"
        style={{
          maxHeight: '90vh',
        }}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Chat Summary</h2>
        <div className="mb-4">
          <label className="text-gray-300 mr-2">Summary Length:</label>
          <select
            value={summaryLength}
            onChange={e => setSummaryLength(e.target.value)}
            className="bg-gray-700 text-white rounded px-2 py-1"
            disabled={isSummarizing}
          >
            <option value="short">Short</option>
            <option value="moderate">Moderate</option>
            <option value="detailed">Detailed</option>
          </select>
          <button
            className="ml-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold transition-colors"
            onClick={handleSummarize}
            disabled={isSummarizing}
          >
            Summarize
          </button>
          {lastFetchedLength.current === 'detailed' && summaryText && (
            <>
              {!pdfUrl && !pdfLoading && (
                <button
                  className="ml-4 px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-md font-semibold transition-colors"
                  onClick={handleGeneratePDF}
                  disabled={isSummarizing}
                >
                  Generate PDF
                </button>
              )}
              {pdfLoading && (
                <span className="ml-4 text-purple-300 flex items-center">
                  <svg className="inline w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Generating PDF...
                </span>
              )}
              {pdfUrl && (
                <button
                  className="ml-4 px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md font-semibold transition-colors"
                  onClick={handleDownloadPDF}
                >
                  Download PDF
                </button>
              )}
            </>
          )}
        </div>
        <div
          className="text-gray-200 whitespace-pre-line mb-6 overflow-y-auto"
          style={{
            maxHeight: '60vh',
            minHeight: '120px',
            paddingRight: '0.5rem',
          }}
        >
          {isSummarizing ? (
            <span>
              <svg className="inline w-4 h-4 mr-2 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Loading summary...
            </span>
          ) : (
            summaryText ? (
              summaryText.includes('Rate limit reached') ? (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-400 font-semibold">API Rate Limit Reached</span>
                  </div>
                  <p className="text-gray-300 text-sm mb-3">
                    The OpenAI API has reached its rate limit. Please try again later (approximately 5 hours) or manually create an exam using the Tools page.
                  </p>
                  <button
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    onClick={() => {
                      navigate('/tools');
                      onClose();
                    }}
                  >
                    Go to Tools Page
                  </button>
                </div>
              ) : (
                <MessageFormatter text={summaryText} isUser={false} />
              )
            ) : null
          )}
        </div>
        <div className="flex justify-between">
          <button
            className="px-5 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-md font-semibold transition-colors"
            onClick={onClose}
            disabled={isSummarizing}
          >
            Close
          </button>
          <button
            className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-md font-semibold transition-colors ml-2"
            onClick={handleTakeExam}
            title="Create exam from summary"
          >
            Take Exam
          </button>
        </div>
      </div>
      
      {/* Warning Popup */}
      {showWarning && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-yellow-500/30">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Summary Required</h3>
            </div>
            <p className="text-gray-300 mb-6">
              {summaryText && summaryText.includes('Rate limit reached') ? (
                <>
                  The OpenAI API rate limit has been reached. Please try again later or go to the Tools page and manually enter a topic for your exam.
                </>
              ) : (
                <>
                  Please generate a valid summary first before taking an exam. Click the "Summarize" button to create a summary of your chat conversation.
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              {summaryText && summaryText.includes('Rate limit reached') && (
                <button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                  onClick={() => {
                    setShowWarning(false);
                    navigate('/tools');
                    onClose();
                  }}
                >
                  Go to Tools
                </button>
              )}
              <button
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md font-medium transition-colors"
                onClick={() => setShowWarning(false)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;
};

export default SummaryModal;
