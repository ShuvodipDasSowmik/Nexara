import React, { useRef, useState } from 'react';
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
  const lastFetchedLength = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

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
            summaryText
              ? <MessageFormatter text={summaryText} isUser={false} />
              : null
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
            onClick={() => {/* exam logic here if needed */}}
            disabled={isSummarizing || !summaryText}
          >
            Take Exam
          </button>
        </div>
      </div>
    </div>
  ) : null;
};

export default SummaryModal;
