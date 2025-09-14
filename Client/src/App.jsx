import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Chat from './Pages/Chat'
import './App.css'
import SignUp from './Pages/SignIn-SignUp/SignUp'
import UserDashboard from './Pages/UserDashboard/UserDashboard'
import NotFound from './Pages/Inaccessible/NotFound'
import Unauthorized from './Pages/Inaccessible/Unauthorized'
import { AuthProvider } from './Context/AuthContext'
import { PostsProvider } from './Context/PostsContext'
import { useParams, useNavigate } from 'react-router-dom'
import ProtectedRoute from './Components/Security/ProtectedRoute'
import TakeExam from './Pages/Exam/TakeExam'
import ExamSummary from './Pages/Exam/ExamSummary'
import SubjectiveExam from './Pages/Exam/SubjectiveExam'
import SubjectiveResults from './Pages/Exam/SubjectiveResults'
import Tools from './Pages/ToolsPages/Tools'
import Home from './Pages/Home'
import Header from './Components/SiteChrome/Header'
import Footer from './Components/SiteChrome/Footer'
import Posts from './Pages/Community/Posts'
import AdminAuth from './Pages/Admin/AdminAuth'
import AdminDashboard from './Pages/Admin/AdminDashboard'
import { useEffect } from 'react'
import API from './API/axios'

function App() {
  useEffect(() => {
    const trackVisitor = async () => {
      try {
        let visitorID = localStorage.getItem('visitorID');
        if (!visitorID) {
          visitorID = 'visitor-' + Math.random().toString(36).slice(2, 18) + Date.now();
          localStorage.setItem('visitorID', visitorID);
        }

        // Fire-and-forget tracking call
        try {
          await API.post('/admin/track-activity', { visitorID });
        } catch (err) {
          // ignore tracking failures
          console.debug('track-activity failed', err?.response?.status || err.message);
        }
      }
      catch (err) {
        console.error('Failed to track user activity:', err);
      }
    };
    trackVisitor();
  }, []);
  return (
    <>
      <AuthProvider>
        <PostsProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={
                <>
                  <Header />
                  <Home />
                </>
              }
              />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:ct_id" element={<Chat />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignUp />} />
              <Route path="/admin/signin" element={<AdminAuth />} />
              <Route path="/admin/signup" element={<AdminAuth />} />
              <Route path="/admin/dashboard" element={
                <ProtectedRoute requiredRole="admin">
                  <Header />
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/community/posts" element={
                <>
                  <Header />
                  <Posts />
                </>
              }
              />
              <Route
                path="/user/dashboard"
                element={
                  <ProtectedRoute>
                    <Header />
                    <UserDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/take"
                element={
                  <ProtectedRoute>
                    <TakeExam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/subjective"
                element={
                  <ProtectedRoute>
                    <SubjectiveExam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/subjective-results"
                element={
                  <ProtectedRoute>
                    <SubjectiveResults />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exam/:examId/summary"
                element={
                  <ProtectedRoute>
                    <ExamSummary />
                  </ProtectedRoute>
                }
              />
              <Route path="/tools" element={
                <>
                  <Header />
                  <Tools />
                </>
              }
              />
              <Route path="*" element={<NotFound />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
          </BrowserRouter>
        </PostsProvider>
      </AuthProvider>
    </>
  )
}

export default App
