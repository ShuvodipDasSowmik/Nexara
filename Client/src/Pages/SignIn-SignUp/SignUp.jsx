import { useState, useRef, useEffect } from 'react';
import API from '../../API/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export default function AuthPage() {

  const { signin, setUser } = useAuth(); // <-- include setUser
  const [mode, setMode] = useState('signin');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    institute: '',
    isUniversity: false,
    grade: '',
    universityLevel: 'Undergraduate',
    subject: '',
    signinIdentifier: '',
  });


  const navigate = useNavigate();


  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signinBy, setSigninBy] = useState('username'); // 'username' or 'email'

  // Animation state and refs
  const [animating, setAnimating] = useState(false);
  const prevMode = useRef(mode);

  useEffect(() => {
    if (prevMode.current !== mode) {
      setAnimating(true);
      const timeout = setTimeout(() => setAnimating(false), 350); // match CSS duration
      prevMode.current = mode;
      return () => clearTimeout(timeout);
    }
  }, [mode]);

  // Handle all field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Format educationLevel for backend
  const getEducationLevel = () => {

    if (formData.isUniversity) {

      if (formData.subject) {
        return `${formData.universityLevel} in ${formData.subject}`;
      }

      return formData.universityLevel;
    }

    else if (formData.grade) {
      return `Grade ${formData.grade}`;
    }
    return '';
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          alert('Passwords do not match');
          setSubmitting(false); // reset submitting on early return
          return;
        }
        const payload = {
          ...formData,
          educationLevel: getEducationLevel(),
        };
        // Remove UI-only fields
        delete payload.isUniversity;
        delete payload.grade;
        delete payload.universityLevel;
        delete payload.subject;
        delete payload.confirmPassword;
        delete payload.signinIdentifier;

        // Create account first
        await API.post('/auth/signup', payload);

        // Try to fetch current user (best effort)
        let user = null;
        try {
          const meRes = await API.get('/auth/me');
          console.log("Fetched user:", meRes);
          
          user = meRes?.data || null;
        } catch (meErr) {
          // ignore - will try signin fallback
        }

        // Fallback: try signin via credentials if /auth/me didn't return a user
        if (!user) {
          const signinCreds = payload.username
            ? { username: payload.username, password: formData.password }
            : { email: payload.email, password: formData.password };
          user = await signin(signinCreds);
        }

        if (user) {
          // ensure AuthContext has the user
          try { setUser(user); } catch {}
          if (user.username) localStorage.setItem('username', user.username);
          if (user.email) localStorage.setItem('email', user.email);
          navigate('/user/dashboard');
        } else {
          alert('Signup succeeded but automatic sign-in failed. Please try signing in.');
        }
      }
      else {
        const creds =
          signinBy === 'username'
            ? { username: formData.signinIdentifier, password: formData.password }
            : { email: formData.signinIdentifier, password: formData.password };

        const user = await signin(creds);

        if (user) {
          navigate('/user/dashboard');
        }
        
        else {
          alert('Signin failed. Please check your credentials.');
        }
      }
    }
    catch (err) {
      alert(
        err?.response?.data?.message ||
        err?.message ||
        (mode === 'signup' ? 'Signup failed' : 'Signin failed')
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading overlay shown while submitting (signing in/up)
  const LoadingOverlay = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        <div className="text-white font-medium">{mode === 'signup' ? 'Signing up...' : 'Signing in...'}</div>
      </div>
    </div>
  );

  // Fix: Only render after hydration to avoid SSR mismatch or hydration issues
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {submitting && <LoadingOverlay />}
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div
          className={`bg-white/5 backdrop-blur-sm w-full rounded-2xl shadow-2xl p-4 border border-gray-700/50 flex flex-col justify-center ${mode === 'signup' ? 'max-w-2xl' : 'max-w-md'
            }`}
          style={{ minHeight: 0, height: 'auto', maxHeight: '95vh' }}
        >
          <div className="flex mb-4">
            <button
              className={`w-1/2 py-2 text-lg font-semibold rounded-l-xl transition-colors duration-200 ${mode === 'signin'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-700/20 text-gray-200 hover:bg-gray-700/40'
                }`}
              onClick={() => setMode('signin')}
            >
              Sign In
            </button>
            <button
              className={`w-1/2 py-2 text-lg font-semibold rounded-r-xl transition-colors duration-200 ${mode === 'signup'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-700/20 text-gray-200 hover:bg-gray-700/40'
                }`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
          </div>
          {/* Animated form container */}
          <div
            className={`transition-all duration-250 ${animating
              ? 'opacity-0 translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0'
              } flex-1 flex flex-col justify-center`}
            style={{ minHeight: 0 }}
          >
            <form
              className="space-y-2"
              style={{ maxHeight: 'none' }}
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
            >
              {/* Staggered fields for signup */}
              {mode === 'signup' && !animating && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-2">
                  <StaggeredInput index={0} label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} inputClass="py-1 text-sm" />
                  <StaggeredInput index={1} label="Institute" name="institute" value={formData.institute} onChange={handleChange} inputClass="py-1 text-sm" />
                  <div className="flex items-center space-x-2 transition-all duration-300 col-span-2" style={{ transitionDelay: '120ms' }}>
                    <input
                      id="isUniversity"
                      name="isUniversity"
                      type="checkbox"
                      checked={formData.isUniversity}
                      onChange={handleChange}
                      className="accent-blue-500"
                    />
                    <label htmlFor="isUniversity" className="text-gray-200 text-xs select-none">
                      University Student?
                    </label>
                  </div>
                  {!formData.isUniversity ? (
                    <StaggeredInput
                      index={2}
                      label="Grade"
                      name="grade"
                      type="number"
                      min={1}
                      max={12}
                      value={formData.grade}
                      onChange={handleChange}
                      inputClass="py-1 text-sm"
                    />
                  ) : (
                    <>
                      <StaggeredSelect
                        index={2}
                        label="University Level"
                        name="universityLevel"
                        value={formData.universityLevel}
                        onChange={handleChange}
                        options={[
                          { value: 'Undergraduate', label: 'Undergraduate' },
                          { value: 'Postgraduate', label: 'Postgraduate' },
                        ]}
                        selectClass="py-1 text-sm"
                      />
                      <StaggeredInput
                        index={3}
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. CSE"
                        inputClass="py-1 text-sm"
                      />
                    </>
                  )}
                  <StaggeredInput
                    index={formData.isUniversity ? 4 : 3}
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    inputClass="py-1 text-sm"
                  />
                  <StaggeredInput
                    index={formData.isUniversity ? 5 : 4}
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    inputClass="py-1 text-sm"
                  />
                  <StaggeredInput
                    index={formData.isUniversity ? 6 : 5}
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    showToggle
                    show={showPassword}
                    setShow={setShowPassword}
                    inputClass="py-1 text-sm pr-8"
                  />
                  <StaggeredInput
                    index={formData.isUniversity ? 7 : 6}
                    label="Confirm Password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    showToggle
                    show={showConfirmPassword}
                    setShow={setShowConfirmPassword}
                    inputClass="py-1 text-sm pr-8"
                  />
                </div>
              )}
              {mode === 'signin' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="flex items-center">
                      <span className="text-xs text-gray-400 mr-2 font-medium">Sign in by</span>
                      <div className="relative flex items-center bg-gray-800 rounded-full shadow-inner border border-gray-700 overflow-hidden">
                        <button
                          type="button"
                          className={`px-4 py-1.5 text-xs font-semibold z-10 transition-all duration-200 focus:outline-none ${signinBy === 'username'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                            : 'bg-transparent text-gray-300 hover:bg-gray-700/60'
                            }`}
                          onClick={() => setSigninBy('username')}
                          tabIndex={-1}
                          style={{ borderTopLeftRadius: '9999px', borderBottomLeftRadius: '9999px' }}
                        >
                          Username
                        </button>
                        <button
                          type="button"
                          className={`px-4 py-1.5 text-xs font-semibold z-10 transition-all duration-200 focus:outline-none ${signinBy === 'email'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow'
                            : 'bg-transparent text-gray-300 hover:bg-gray-700/60'
                            }`}
                          onClick={() => setSigninBy('email')}
                          tabIndex={-1}
                          style={{ borderTopRightRadius: '9999px', borderBottomRightRadius: '9999px' }}
                        >
                          Email
                        </button>
                        <span
                          className="absolute top-0 left-0 h-full w-1/2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 transition-transform duration-300 pointer-events-none"
                          style={{
                            transform:
                              signinBy === 'username'
                                ? 'translateX(0%)'
                                : 'translateX(100%)',
                          }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>
                  <StaggeredInput
                    index={0}
                    label={signinBy === 'username' ? 'Username' : 'Email'}
                    name="signinIdentifier"
                    value={formData.signinIdentifier || ''}
                    onChange={handleChange}
                    placeholder={
                      signinBy === 'username'
                        ? 'Enter your username'
                        : 'Enter your email'
                    }
                    inputClass="py-1 text-sm"
                  />
                  <StaggeredInput
                    index={1}
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    showToggle
                    show={showPassword}
                    setShow={setShowPassword}
                    inputClass="py-1 text-sm pr-8"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-1.5 px-4 mt-1 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-300 text-sm"
                style={{
                  opacity: animating ? 0 : 1,
                  // small improvement: no buggy multiply string
                  transitionDelay: `${mode === 'signup' ? (formData.isUniversity ? 8 : 7) * 60 : 2 * 60}ms`
                }}
              >
                {mode === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
              
              {/* Admin Login Link */}
              {mode === 'signin' && (
                <div className="text-center mt-3">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/signin')}
                    className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    Admin? Sign in here
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// StaggeredInput for field animation
function StaggeredInput({ index, showToggle, show, setShow, ...props }) {
  const delay = `${index * 60}ms`;
  return (
    <div
      className="transition-all duration-300 opacity-100 translate-y-0"
      style={{
        transitionDelay: delay,
        opacity: props.value !== undefined ? 1 : 0,
        transform: 'translateY(0)'
      }}
    >
      <Input {...props} showToggle={showToggle} show={show} setShow={setShow} />
    </div>
  );
}

// StaggeredSelect for select animation
function StaggeredSelect({ index, label, name, value, onChange, options }) {
  const delay = `${index * 60}ms`;
  return (
    <div
      className="transition-all duration-300 opacity-100 translate-y-0"
      style={{
        transitionDelay: delay,
        opacity: value !== undefined ? 1 : 0,
        transform: 'translateY(0)'
      }}
    >
      <label htmlFor={name} className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-gray-900/60 text-gray-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function Input({ label, name, value, onChange, type = 'text', placeholder, min, max, showToggle, show, setShow }) {
  return (
    <div className="relative">
      <label htmlFor={name} className="block text-sm font-medium text-gray-200 mb-1">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 bg-gray-900/60 text-gray-100 border border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        placeholder={placeholder || label}
        min={min}
        max={max}
        autoComplete="off"
      />
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 text-gray-400 hover:text-gray-200 focus:outline-none"
          style={{ padding: 0, lineHeight: 0, transform: 'translateY(50%)' }}
          onClick={() => setShow((prev) => !prev)}
        >
          {show ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7s4-7 9-7c1.657 0 3.216.41 4.563 1.125M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .512-.122.995-.338 1.414M6.1 6.1C4.42 7.37 3 9.03 3 12c0 3 4 7 9 7 1.61 0 3.117-.378 4.41-1.04M17.657 17.657A9.969 9.969 0 0021 12c0-2.97-1.42-4.63-3.1-5.9" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}