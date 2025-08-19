import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../API/axios";
import { useAuth } from "../../Context/AuthContext";
import ProgressBar from "./ProgressBar";
import LastFiveScoresChart from "./LastFiveScoresChart";

const UserDashboard = () => {
    const [user, setUser] = useState(null);
    const [pdfDataList, setPdfDataList] = useState([]);
    const [loading, setLoading] = useState(true); // loading for dashboard fetch
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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center px-2 pt-8">
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Info Panel */}
                <section className="col-span-1 md:col-span-1 bg-gray-800/70 rounded-2xl p-6 flex flex-col shadow-sm h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-white">Welcome, {user?.fullName}</h1>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded font-semibold shadow hover:from-blue-700 hover:to-purple-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                    <div className="space-y-2">
                        <DashboardField label="Full Name" value={user.fullName} />
                        <DashboardField label="Username" value={user.username} />
                        <DashboardField label="Email" value={user.email} />
                        <DashboardField label="Institute" value={user.institute} />
                        <DashboardField label="Education Level" value={user.educationLevel} />
                    </div>

                    {/* Progress bar below details (average of last 5 scores) */}
                    {user.averageLastFive !== undefined && user.averageLastFive !== null && (
                        <>
                            <ProgressBar percentage={user.averageLastFive} />
                            <div className="mt-2 text-sm text-blue-300 text-center font-semibold">{user.progressLabel}</div>
                        </>
                    )}

                    {/* Bar chart below progress bar */}
                    <LastFiveScoresChart />
                </section>

                {/* PDFs Panel */}
                <section
                    className="col-span-1 md:col-span-2 bg-gray-800/60 rounded-2xl p-6 flex flex-col shadow-sm"
                    style={{ maxHeight: "600px", overflowY: "auto" }}
                >
                    <h2 className="text-xl font-semibold text-white mb-4">Your PDFs</h2>
                    {pdfDataList.length === 0 ? (
                        <div className="text-gray-400 italic">No PDFs uploaded yet.</div>
                    ) : (
                        <div className="divide-y divide-gray-700">
                            {pdfDataList.map(pdf => (
                                <PdfPreview
                                    key={pdf.id}
                                    pdf={pdf}
                                    onExamClick={() => navigate('/tools', { state: { inputText: pdf.fullText || '', title: pdf.title || 'AI Generated Exam' } })}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Future sections can be added here as new <section> elements */}
            </div>
        </div>
    );
};

function DashboardField({ label, value }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-32 text-gray-400 font-medium">{label}:</span>
            <span className="flex-1 text-gray-100 font-mono break-all">{value || <span className="italic text-gray-500">Not set</span>}</span>
        </div>
    );
}

function PdfPreview({ pdf, onExamClick }) {
    // Show title and first 100 chars of fullText, separated by divider
    return (
        <div className="py-4">
            <div className="font-bold text-blue-400 text-lg mb-1">{pdf.title}</div>
            <div className="text-gray-200 text-sm mb-1">
                {pdf.fullText
                    ? pdf.fullText.slice(0, 100) + (pdf.fullText.length > 100 ? "..." : "")
                    : <span className="italic text-gray-500">No preview available</span>
                }
            </div>
            <div className="text-xs text-gray-500">Author: {pdf.author || "Unknown"}</div>
            <div className="mt-2">
                <button
                    type="button"
                    onClick={onExamClick}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition"
                >
                    Exam
                </button>
            </div>
        </div>
    );
}

export default UserDashboard;