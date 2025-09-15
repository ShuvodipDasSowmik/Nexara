import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../API/axios";
import { useAuth } from "../../Context/AuthContext";
import ProgressBar from "./ProgressBar";
import LastFiveScoresChart from "./LastFiveScoresChart";
import UserPosts from "./UserPosts";

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [pdfDataList, setPdfDataList] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true); // loading for dashboard fetch
    const [examLoading, setExamLoading] = useState(true);
    const [examError, setExamError] = useState(null);
    const { logout, currentUser, loading: authLoading } = useAuth();
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    // Fetch dashboard only after auth check finished
    useEffect(() => {
        if (authLoading) return;

        // if not logged in, redirect to signup
        if (!currentUser) {
            navigate("/signup");
            return;
        }
        console.log(user);

        setLoading(true);
        API.get("/users/dashboard")
            .then(res => {
                const { student, pdfDataList } = res.data;
                if (student && student.username) {
                    setUser(student);
                    setPdfDataList(pdfDataList || []);
                    setError(null);
                } else {
                    setUser(null);
                    setPdfDataList([]);
                    setError("No user data found.");
                }
            })
            .catch((err) => {
                setUser(null);
                setPdfDataList([]);
                const msg = err?.response?.data?.message || err?.message || "Failed to load dashboard data.";
                console.error("Failed to load dashboard data:", msg);
                setError(msg);

                if (err.response?.status === 403) {
                    navigate("/signup");
                }
            })
            .finally(() => setLoading(false));
    }, [authLoading, currentUser, navigate]);

    // Fetch exam history
    useEffect(() => {
        if (authLoading || !currentUser) return;
        
        setExamLoading(true);
        API.get('/users/exams')
            .then(res => {
                setExams(res.data || []);
                setExamError(null);
            })
            .catch(err => {
                console.error('Error fetching user exams:', err);
                setExamError('Failed to load exam history');
                setExams([]);
            })
            .finally(() => {
                setExamLoading(false);
            });
    }, [authLoading, currentUser]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/signup");
        }
        catch (err) {
            setError("Logout failed. Please try again.");
        }
    };

    // Unified loading: wait for auth check and dashboard fetch
    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-200">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-lg">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-red-400">
                <h2 className="text-lg font-semibold mb-2">Error</h2>
                <p>{error}</p>
                <button
                    onClick={handleLogout}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
                >
                    Try Logout Again
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center px-4 pt-8">
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* User Info Panel */}
                <section className="col-span-1 lg:col-span-2 bg-gray-800/70 rounded-2xl p-6 flex flex-col shadow-lg h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-white">Welcome, {user?.fullName}</h1>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <DashboardField label="Full Name" value={user.fullName} />
                            <DashboardField label="Username" value={user.username} />
                            <DashboardField label="Email" value={user.email} />
                            <DashboardField label="Institute" value={user.institute} />
                            <DashboardField label="Education Level" value={user.educationLevel} />
                        </div>
                        <div className="flex flex-col justify-center">
                            {/* Progress bar below details (average of last 5 scores) */}
                            {user.averageLastFive !== undefined && user.averageLastFive !== null && (
                                <>
                                    <ProgressBar percentage={user.averageLastFive} />
                                    <div className="mt-2 text-sm text-blue-300 text-center font-semibold">{user.progressLabel}</div>
                                </>
                            )}
                        </div>
                    </div>
                </section>

                {/* Chart Panel */}
                <section className="col-span-1 lg:col-span-2 bg-gray-800/70 rounded-2xl p-6 flex flex-col shadow-lg h-fit">
                    <LastFiveScoresChart />
                </section>

                {/* Exam History Panel */}
                <section className="col-span-1 lg:col-span-2 bg-gray-800/60 rounded-2xl p-6 flex flex-col shadow-lg" style={{ minHeight: "420px", maxHeight: "520px" }}>
                    <h2 className="text-xl font-bold text-white mb-4 tracking-wide">Your Exam History</h2>
                    {examLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="flex flex-col items-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
                                <p className="text-gray-400 text-sm font-medium">Loading exam history...</p>
                            </div>
                        </div>
                    ) : examError ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-red-400 text-xl mb-2">⚠️</div>
                                <p className="text-red-400 font-medium text-base">{examError}</p>
                                <p className="text-gray-500 text-sm mt-1">Please try refreshing the page</p>
                            </div>
                        </div>
                    ) : exams.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-5xl mb-3">📝</div>
                                <p className="text-gray-400 font-medium text-base mb-1">No exams taken yet</p>
                                <p className="text-gray-500 text-sm">Start taking exams to build your history!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 rounded-lg border border-gray-700 h-full overflow-y-auto">
                            <div className="space-y-3 p-4">
                                {exams.map((exam) => (
                                    <ExamPreview
                                        key={exam.examId}
                                        exam={exam}
                                        onSummarizeClick={() => navigate(`/exam/${exam.examId}/summary`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* PDFs Panel */}
                <section
                    className="col-span-1 lg:col-span-2 bg-gray-800/60 rounded-2xl p-6 flex flex-col shadow-lg"
                    style={{ minHeight: "420px", maxHeight: "520px" }}
                >
                    <h2 className="text-xl font-bold text-white mb-4 tracking-wide">Your Documents</h2>
                    {pdfDataList.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="text-5xl mb-3">📄</div>
                                <p className="text-gray-400 font-medium text-base mb-1">No documents uploaded yet</p>
                                <p className="text-gray-500 text-sm">Upload PDFs to start generating exams!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-800/50 rounded-lg border border-gray-700 h-full overflow-y-auto">
                            <div className="space-y-3 p-4">
                                {pdfDataList.map(pdf => (
                                    <PdfPreview
                                        key={pdf.id}
                                        pdf={pdf}
                                        onExamClick={() => navigate('/tools', { state: { inputText: pdf.fullText || '', title: pdf.title || 'AI Generated Exam' } })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* User Posts Panel */}


                {/* Future sections can be added here as new <section> elements */}
            </div>
            <div className="col-span-1 lg:col-span-1 bg-gray-800/60 rounded-2xl p-6 m-12 flex flex-col shadow-sm h-full min-h-0" style={{ overflowY: 'auto' }}>
                <h2 className="text-3xl font-semibold text-center text-white mb-4">Your Posts</h2>
                <hr className="border-gray-700 mb-4" />
                <UserPosts />
            </div>
        </div>
    );
};

function DashboardField({ label, value }) {
    return (
        <div className="flex items-center gap-2 py-1">
            <span className="w-32 text-gray-300 font-medium text-sm">{label}:</span>
            <span className="flex-1 text-gray-100 font-medium text-sm break-all">{value || <span className="italic text-gray-500">Not set</span>}</span>
        </div>
    );
}

function PdfPreview({ pdf, onExamClick }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-gray-700/40 rounded-xl border border-gray-600 p-4 hover:bg-gray-700/60 transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-base truncate mb-1">
                        {pdf.title || 'Untitled Document'}
                    </h3>
                    <div className="text-gray-300 text-sm mb-2 leading-relaxed line-clamp-2">
                        {pdf.fullText
                            ? pdf.fullText.slice(0, 120) + (pdf.fullText.length > 120 ? "..." : "")
                            : <span className="italic text-gray-500">No preview available</span>
                        }
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">Author:</span>
                            <span className="text-gray-300 font-medium">
                                {pdf.author || "Unknown"}
                            </span>
                        </div>
                        {pdf.createdAt && (
                            <div className="flex items-center gap-1">
                                <span className="text-gray-500">Uploaded:</span>
                                <span className="text-gray-300">
                                    {formatDate(pdf.createdAt)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onExamClick}
                    className="ml-3 px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 whitespace-nowrap shadow-md"
                >
                    Generate Exam
                </button>
            </div>
        </div>
    );
}

function ExamPreview({ exam, onSummarizeClick }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 90) return 'text-green-400';
        if (percentage >= 70) return 'text-blue-400';
        if (percentage >= 50) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-gray-700/40 rounded-xl border border-gray-600 p-4 hover:bg-gray-700/60 transition-all duration-200">
            <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-base truncate mb-1">
                        {exam.title || `Exam #${exam.examId}`}
                    </h3>
                    <div className="text-gray-300 text-sm mb-2 leading-relaxed line-clamp-2">
                        {exam.description || <span className="italic text-gray-500">No description available</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">Score:</span>
                            <span className={`font-semibold ${getScoreColor(exam.percentage)}`}>
                                {exam.percentage}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-gray-500">Date:</span>
                            <span className="text-gray-300">
                                {formatDate(exam.date)}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onSummarizeClick}
                    className="ml-3 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap shadow-md"
                >
                    View Summary
                </button>
            </div>
        </div>
    );
}

export default UserDashboard;