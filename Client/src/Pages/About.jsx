import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

const About = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleGetStarted = () => {
    if (currentUser) {
      // User is already logged in, redirect to dashboard or tools
      navigate('/tools');
    } else {
      // User is not logged in, redirect to signup
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen from-gray-900 via-gray-800 to-gray-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text mb-4">
            About Nexara
          </h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            Empowering Education Through AI Innovation
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            Nexara is revolutionizing the way students learn and assess their knowledge through cutting-edge artificial intelligence. 
            We believe that personalized, intelligent education tools can unlock every learner's potential and make quality assessment 
            accessible to everyone, everywhere.
          </p>
        </div>

        {/* What We Do Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">What We Do</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-blue-400 font-semibold mb-1">AI-Powered Exam Generation</h3>
                  <p className="text-gray-300 text-sm">Transform any PDF document or text into comprehensive, tailored exams</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-purple-400 font-semibold mb-1">Intelligent Assessment</h3>
                  <p className="text-gray-300 text-sm">Advanced AI evaluation for both multiple-choice and subjective questions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-pink-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-pink-400 font-semibold mb-1">Personalized Learning</h3>
                  <p className="text-gray-300 text-sm">Smart content recommendations based on your learning patterns</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-green-400 font-semibold mb-1">Community Learning</h3>
                  <p className="text-gray-300 text-sm">Connect with fellow learners, share insights, and grow together</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-1">Real-time Analytics</h3>
                  <p className="text-gray-300 text-sm">Track your progress with detailed performance insights and scoring</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-3"></div>
                <div>
                  <h3 className="text-cyan-400 font-semibold mb-1">AI Chat Assistant</h3>
                  <p className="text-gray-300 text-sm">Get instant help with context-aware AI powered by RAG technology</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Nexara Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Why Choose Nexara?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-2xl mb-3">🚀</div>
              <h3 className="text-blue-400 font-semibold mb-2">Instant Exam Creation</h3>
              <p className="text-gray-300 text-sm">Upload your study materials and get professionally crafted exams in seconds</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-2xl mb-3">🤖</div>
              <h3 className="text-purple-400 font-semibold mb-2">AI-Driven Evaluation</h3>
              <p className="text-gray-300 text-sm">Fair, consistent, and detailed assessment with personalized feedback</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-2xl mb-3">📊</div>
              <h3 className="text-pink-400 font-semibold mb-2">Smart Analytics</h3>
              <p className="text-gray-300 text-sm">Comprehensive dashboard tracking your learning journey and improvement areas</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-2xl mb-3">🌐</div>
              <h3 className="text-green-400 font-semibold mb-2">Accessible Learning</h3>
              <p className="text-gray-300 text-sm">Study anytime, anywhere with our responsive, user-friendly platform</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-2xl mb-3">🤝</div>
              <h3 className="text-yellow-400 font-semibold mb-2">Community Support</h3>
              <p className="text-gray-300 text-sm">Join a vibrant community of learners sharing knowledge and experiences</p>
            </div>
            <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30">
              <div className="text-2xl mb-3">💡</div>
              <h3 className="text-cyan-400 font-semibold mb-2">Smart Technology</h3>
              <p className="text-gray-300 text-sm">Powered by cutting-edge RAG AI for contextual and relevant responses</p>
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Our Vision</h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">
            To democratize quality education by making intelligent, personalized learning tools accessible to students worldwide. 
            We envision a future where AI empowers every learner to achieve their academic goals efficiently and effectively.
          </p>
          
          {/* Quote */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 border-l-4 border-blue-400">
            <blockquote className="text-blue-200 text-lg italic font-medium mb-3">
              "Learning is not about memorizing facts, but about understanding concepts and applying knowledge. 
              Nexara helps you achieve both."
            </blockquote>
            <div className="text-gray-400 text-sm">— The Nexara Team</div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-2xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white">Built for Students, By Educators</h2>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            Our team combines expertise in artificial intelligence, educational psychology, and user experience design to create 
            tools that truly enhance learning outcomes. We understand the challenges students face and are committed to providing 
            solutions that make studying more effective and engaging.
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl p-8 text-center border border-blue-500/30">
          <h3 className="text-2xl font-bold text-white mb-4">
            Join thousands of students who are already transforming their study experience with Nexara.
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGetStarted}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              {currentUser ? 'Go to Tools' : 'Get Started Today'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-gray-700/50 text-gray-200 font-semibold rounded-xl border border-gray-600 hover:bg-gray-600/50 transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
