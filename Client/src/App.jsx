import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Chat from './Pages/Chat'
import './App.css'
import SignUp from './Pages/SignIn-SignUp/SignUp'
import UserDashboard from './Pages/UserDashboard/UserDashboard'
import NotFound from './Pages/Inaccessible/NotFound'
import Unauthorized from './Pages/Inaccessible/Unauthorized'
import { AuthProvider } from './Context/AuthContext'
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

function App() {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Header />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:ct_id" element={<Chat />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/community/posts" element={<Posts />} />
            <Route
              path="/user/dashboard"
              element={
                <ProtectedRoute>
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
            <Route path="/tools" element={<Tools />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}

export default App
