import React, { useState } from "react";
import API from "../../API/axios";

const PDFParser = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pdfData, setPdfData] = useState(null);
  const [showPages, setShowPages] = useState(false);
  const [expandedPages, setExpandedPages] = useState({});

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError("");
    setSuccess("");
    setPdfData(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Please select a PDF file.");
      return;
    }
    setUploading(true);
    setError("");
    setSuccess("");
    setPdfData(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await API.post("/tools/pdf-parser", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess("PDF uploaded and parsed successfully!");
      setPdfData(response.data);
      setSelectedFile(null);
      setExpandedPages({});
    } catch (err) {
      setError("Failed to upload PDF. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Expand/collapse all pages
  const handleExpandAll = () => {
    if (!pdfData?.pages) return;
    const allExpanded = {};
    pdfData.pages.forEach((page, idx) => {
      allExpanded[page.pageNumber || idx] = true;
    });
    setExpandedPages(allExpanded);
  };
  const handleCollapseAll = () => setExpandedPages({});

  // Toggle single page
  const togglePage = (pageNumber) => {
    setExpandedPages((prev) => ({
      ...prev,
      [pageNumber]: !prev[pageNumber],
    }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-lg p-6 mt-8 mb-8 border border-gray-700/50">
      <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5-5m0 0l5 5m-5-5v12M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        </span>
        Upload PDF
      </h2>
      <form className="flex flex-col gap-4" onSubmit={handleUpload}>
        <label className="flex flex-col items-center px-4 py-5 bg-gray-800/70 text-blue-400 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700 transition">
          <span className="text-base font-medium">
            {selectedFile ? selectedFile.name : "Select a PDF file"}
          </span>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <button
          type="submit"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2 rounded-md shadow hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          disabled={uploading || !selectedFile}
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {success && <div className="text-green-400 text-sm">{success}</div>}
      </form>

      {/* PDF Data Display */}
      {pdfData && (
        <div className="mt-6 bg-gray-800/70 rounded-lg p-4 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 113 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
              </svg>
            </span>
            PDF Metadata
          </h3>
          <ul className="text-gray-300 text-sm mb-3 space-y-1">
            <li><span className="font-semibold text-white">Title:</span> {pdfData.title || <span className="italic text-gray-500">N/A</span>}</li>
            <li><span className="font-semibold text-white">Author:</span> {pdfData.author || <span className="italic text-gray-500">N/A</span>}</li>
            <li><span className="font-semibold text-white">Subject:</span> {pdfData.subject || <span className="italic text-gray-500">N/A</span>}</li>
            <li><span className="font-semibold text-white">Keywords:</span> {pdfData.keywords || <span className="italic text-gray-500">N/A</span>}</li>
            <li><span className="font-semibold text-white">Total Pages:</span> {pdfData.totalPages}</li>
          </ul>

          {/* Full Text Section */}
          <FullTextSection fullText={pdfData.fullText} />

          {/* Per Page Section */}
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <button
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-sm transition 
                ${showPages
                  ? "bg-blue-600 text-white hover:bg-purple-600"
                  : "bg-gray-700 text-blue-300 hover:bg-blue-600 hover:text-white"}
              `}
              onClick={() => setShowPages((v) => !v)}
              type="button"
            >
              {showPages ? (
                <>
                  <span className="inline-block">▼</span> Hide Per Page Text
                </>
              ) : (
                <>
                  <span className="inline-block">▶</span> Show Per Page Text
                </>
              )}
            </button>
            {showPages && pdfData.pages && pdfData.pages.length > 1 && (
              <>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-xs bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white transition"
                  onClick={handleExpandAll}
                  type="button"
                >
                  <span>⤢</span> Expand All
                </button>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-xs bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white transition"
                  onClick={handleCollapseAll}
                  type="button"
                >
                  <span>⤡</span> Collapse All
                </button>
              </>
            )}
          </div>
          {showPages && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto border-t border-gray-700 pt-4">
              {pdfData.pages && pdfData.pages.length > 0 ? (
                pdfData.pages.map((page, idx) => {
                  const isExpanded = expandedPages[page.pageNumber || idx];
                  return (
                    <div
                      key={page.id || idx}
                      className="rounded-lg bg-gray-900/70 border border-gray-700 flex flex-col"
                    >
                      <button
                        className={`w-full flex items-center justify-between px-3 py-2 text-left focus:outline-none rounded-t-lg transition
                          ${isExpanded ? "bg-blue-900/40" : ""}
                        `}
                        onClick={() => togglePage(page.pageNumber || idx)}
                        type="button"
                      >
                        <span className="font-semibold text-white text-sm truncate">
                          Page {page.pageNumber}
                        </span>
                        <span className="text-blue-400">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="px-3 pb-3">
                          <div className="text-gray-300 text-xs whitespace-pre-line bg-gray-900/80 rounded p-2 border border-gray-800 font-mono max-h-32 overflow-y-auto">
                            {page.text ? page.text : <span className="italic text-gray-500">No text extracted.</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-xs italic">No page details available.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Full Text Section with improved style
const FullTextSection = ({ fullText }) => {
  const [showFullText, setShowFullText] = useState(false);

  if (!fullText) return null;

  return (
    <div className="mb-4">
      <button
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-medium text-sm transition mb-2
          ${showFullText
            ? "bg-blue-600 text-white hover:bg-purple-600"
            : "bg-gray-700 text-blue-300 hover:bg-blue-600 hover:text-white"}
        `}
        onClick={() => setShowFullText(v => !v)}
        type="button"
      >
        {showFullText ? (
          <>
            <span>▼</span> Hide Full Text
          </>
        ) : (
          <>
            <span>▶</span> Show Full Text
          </>
        )}
      </button>
      {showFullText && (
        <div className="max-h-[400px] overflow-y-auto border-t border-gray-700 pt-2 text-xs text-gray-200 whitespace-pre-line bg-gray-900/80 rounded p-3 font-mono">
          {fullText}
        </div>
      )}
    </div>
  );
};

export default PDFParser;