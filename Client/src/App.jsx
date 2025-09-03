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
import Tools from './Pages/ToolsPages/Tools'
import Home from './Pages/Home'
import Header from './Components/SiteChrome/Header'
import Footer from './Components/SiteChrome/Footer'
import Posts from './Pages/Community/Posts'

function App() {
  return (
    <>
      <AuthProvider>
        <PostsProvider>
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
              <Route path="/tools" element={<Tools />} />
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
