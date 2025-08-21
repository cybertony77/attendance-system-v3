import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import Image from 'next/image';
import { TextInput, PasswordInput, Anchor, Group, Text } from '@mantine/core';
import { FloatingLabelInput } from '../components/FloatingLabelInput';

export default function Login() {
  const [assistant_id, setAssistantId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // 'error' or 'warning'
  const messageTimer = useRef(null);
  const router = useRouter();
  const [forgotMsg, setForgotMsg] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [fieldErrorTimer, setFieldErrorTimer] = useState(null);
  const [redirectMessage, setRedirectMessage] = useState("");
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState("");

  useEffect(() => {
    // Check if user was redirected from a protected page
    const redirectPath = sessionStorage.getItem("redirectAfterLogin");
    if (redirectPath && redirectPath !== "/") {
      setRedirectMessage(`You must log in first to access: ${redirectPath}`);
    } else if (sessionStorage.getItem("redirectAfterLogin")) {
      setRedirectMessage("You must log in first to access this page.");
    }
    
    // Check if user tried to access dashboard specifically
    const dashboardAccessAttempted = sessionStorage.getItem("dashboardAccessAttempted");
    if (dashboardAccessAttempted === "1") {
      setRedirectMessage("You must log in first to access: /dashboard");
      // Clear the flag since we've shown the message
      sessionStorage.removeItem("dashboardAccessAttempted");
    }
    
    // Check if session expired
            const sessionExpired = sessionStorage.getItem("session_expired");
        if (sessionExpired === "1") {
          // Clear the session expired flag
          sessionStorage.removeItem("session_expired");
      
      // Get the page they were trying to access
      const expiredRedirectPath = sessionStorage.getItem("redirectAfterLogin");
      if (expiredRedirectPath && expiredRedirectPath !== "/") {
        setSessionExpiredMessage(`Your session has expired. Please log in again to access: ${expiredRedirectPath}`);
      } else {
        setSessionExpiredMessage("Your session has expired. Please log in again to continue.");
      }
    }
  }, []);

  useEffect(() => {
    if (message) {
      if (messageTimer.current) clearTimeout(messageTimer.current);
      messageTimer.current = setTimeout(() => {
        setMessage("");
      }, 5000);
    }
    return () => {
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, [message]);

  useEffect(() => {
    if (forgotMsg) {
      const timer = setTimeout(() => setForgotMsg("") , 5000);
      return () => clearTimeout(timer);
    }
  }, [forgotMsg]);

  useEffect(() => {
    if (sessionExpiredMessage) {
      const timer = setTimeout(() => setSessionExpiredMessage("") , 8000); // Show for 8 seconds
      return () => clearTimeout(timer);
    }
  }, [sessionExpiredMessage]);

  useEffect(() => {
    if (redirectMessage) {
      const timer = setTimeout(() => setRedirectMessage("") , 8000); // Show for 8 seconds
      return () => clearTimeout(timer);
    }
  }, [redirectMessage]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("🚀 Login attempt started...");
    setMessage("");
    setUsernameError("");
    setPasswordError("");
    setRedirectMessage(""); // Clear redirect message on login attempt
    setSessionExpiredMessage(""); // Clear session expired message on login attempt
    if (fieldErrorTimer) clearTimeout(fieldErrorTimer);
    
    try {
      console.log("📡 Sending login request to:", `${getApiBaseUrl()}/api/auth/login`);
      const res = await axios.post(`${getApiBaseUrl()}/api/auth/login`, {
        assistant_id,
        password,
      });
      
      console.log("✅ Login response received:", res.data);
      
      // Store token with a more robust mechanism
      sessionStorage.setItem("token", res.data.token);
      console.log("💾 Token stored in sessionStorage");
      
      // Verify token was stored
      const storedToken = sessionStorage.getItem("token");
      if (!storedToken) {
        console.error("❌ Token storage failed");
        setMessage("Login failed. Please try again.");
        return;
      }
      
      console.log("✅ Token verified in sessionStorage");

      console.log("✅ Login successful, token stored, redirecting...");

      // Force authentication state update and redirect
      setTimeout(() => {
        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        console.log("🔍 Redirect path found:", redirectPath);
        console.log("🔍 Current router path:", router.asPath);
        
        // Force a small delay to ensure sessionStorage is properly set
        const targetPath = redirectPath && redirectPath !== "/" && redirectPath !== router.asPath && redirectPath.startsWith('/') && redirectPath.length > 1 
          ? redirectPath 
          : "/dashboard";
        
        console.log(`🎯 Target path: ${targetPath}`);
        
        if (redirectPath && redirectPath !== "/" && redirectPath !== router.asPath) {
          // Check if it's a valid path
          if (redirectPath.startsWith('/') && redirectPath.length > 1) {
            console.log(`🔄 Redirecting to intended page: ${redirectPath}`);
            sessionStorage.removeItem("redirectAfterLogin");
            // Try router.replace first, fallback to window.location
            try {
              router.replace(redirectPath);
              // If router.replace doesn't work, use window.location as fallback
              setTimeout(() => {
                if (window.location.pathname !== redirectPath) {
                  console.log("⚠️ Router redirect failed, using window.location fallback");
                  window.location.href = redirectPath;
                }
              }, 500);
            } catch (error) {
              console.error("❌ Router redirect error:", error);
              window.location.href = redirectPath;
            }
          } else {
            console.log(`⚠️ Invalid redirect path: ${redirectPath}, going to dashboard`);
            sessionStorage.removeItem("redirectAfterLogin");
            try {
              router.replace("/dashboard");
              setTimeout(() => {
                if (window.location.pathname !== "/dashboard") {
                  console.log("⚠️ Router redirect failed, using window.location fallback");
                  window.location.href = "/dashboard";
                }
              }, 500);
            } catch (error) {
              console.error("❌ Router redirect error:", error);
              window.location.href = "/dashboard";
            }
          }
        } else {
          console.log(`🔄 No redirect path, going to dashboard`);
          try {
            router.replace("/dashboard");
            setTimeout(() => {
              if (window.location.pathname !== "/dashboard") {
                console.log("⚠️ Router redirect failed, using window.location fallback");
                window.location.href = "/dashboard";
              }
            }, 500);
          } catch (error) {
            console.error("❌ Router redirect error:", error);
            window.location.href = "/dashboard";
          }
        }
      }, 200); // Slightly increased delay to ensure token is properly stored
      
    } catch (err) {
      setUsernameError("");
      setPasswordError("");
      setMessage("");
      if (err.response?.data?.error === 'user_not_found') {
        setMessage("Wrong username and password");
      } else if (err.response?.data?.error === 'wrong_password') {
        setPasswordError("Wrong password");
      } else {
        setMessage("Wrong username and password");
      }
      // Auto-hide field errors after 6s
      if (fieldErrorTimer) clearTimeout(fieldErrorTimer);
      const timer = setTimeout(() => {
        setUsernameError("");
        setPasswordError("");
        setMessage("");
      }, 5000);
      setFieldErrorTimer(timer);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh"
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <style jsx>{`
          .login-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            max-width: 450px;
            width: 100%;
            position: relative;
            overflow: hidden;
          }
          .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #87CEEB, #B0E0E6, #ADD8E6);
            background-size: 200% 100%;
            animation: gradientShift 3s ease infinite;
          }
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          .logo-section {
            text-align: center;
            margin-bottom: 32px;
          }
          .logo-icon {
            width: 80px;
            height: 80px;
            margin-bottom: 16px;
            border-radius: 50%;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            object-fit: cover;
            background: transparent;
          }
          .title {
            font-size: 2.2rem;
            font-weight: 700;
            color:rgb(0, 0, 0);
            margin-bottom: 8px;
          }
          .subtitle {
            color: #6c757d;
            font-size: 1rem;
            margin-bottom: 0;
          }
          .form-group {
            margin-bottom: 24px;
          }
          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #495057;
            font-size: 0.95rem;
          }
          .form-input {
            width: 100%;
            padding: 16px 20px;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-sizing: border-box;
            background: #ffffff;
            position: relative;
            color: #000000;
          }
          .form-input:focus {
            outline: none;
            border-color: #87CEEB;
            background: white;
            box-shadow: 0 0 0 4px rgba(135, 206, 235, 0.1);
            transform: translateY(-2px);
          }
          .form-input::placeholder {
            color: #adb5bd;
          }
          .input-wrapper {
            position: relative;
          }
          .input-icon {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            color: #6c757d;
            font-size: 1.1rem;
          }
          .input-with-icon {
            padding-left: 48px;
          }
          .login-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 24px rgba(135, 206, 235, 0.3);
            position: relative;
            overflow: hidden;
          }
          .login-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
          }
          .login-btn:hover::before {
            left: 100%;
          }
          .login-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 32px rgba(135, 206, 235, 0.4);
          }
          .login-btn:active {
            transform: translateY(-1px);
          }
          .error-message {
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
            color: white;
            border-radius: 10px;
            padding: 16px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
            animation: shake 0.5s ease-in-out;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .footer-text {
            text-align: center;
            margin-top: 24px;
            color: #6c757d;
            font-size: 0.9rem;
          }
          .footer-text a {
            color: #87CEEB;
            text-decoration: none;
            font-weight: 600;
          }
          .footer-text a:hover {
            text-decoration: underline;
          }
          .form-input.error-border {
            border-color: #dc3545 !important;
            background: #fff5f5 !important;
          }
          @media (max-width: 480px) {
            .login-container {
              padding: 30px 20px;
              margin: 10px;
            }
            .title {
              font-size: 1.8rem;
            }
            .login-btn {
              padding: 18px;
              font-size: 1.2rem;
            }
          }
          
          @media (max-width: 768px) {
            .login-btn {
              padding: 16px;
              font-size: 1.1rem;
            }
          }
        `}</style>

        <div className="login-container">
          <div className="logo-section">
            <Image src="/logo.png" alt="Logo" width={80} height={80} className="logo-icon" />
            <h1 className="title">Assistant Login</h1>
            <p className="subtitle">Welcome back! Please sign in to continue</p>
          </div>

        <form onSubmit={handleLogin} autoComplete="off">
            <div className="form-group" style={{ marginBottom: usernameError ? 4 : 38 }}>
              <FloatingLabelInput
                label="Assistant ID"
                value={assistant_id}
                onChange={e => setAssistantId(e.target.value)}
                error={usernameError || undefined}
                autoComplete="username"
                type="text"
              />
            </div>
            <div className="form-group" style={{ marginBottom: passwordError ? 4 : 24 }}>
              <FloatingLabelInput
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                error={passwordError || undefined}
                autoComplete="current-password"
                type="password"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 8 }}>
                <a
                  href="#"
                  style={{ color: '#1FA8DC', cursor: 'pointer', fontWeight: 500, textDecoration: 'underline', fontSize: '0.85rem' }}
                  onClick={e => { 
                    e.preventDefault(); 
                    setForgotMsg('Contact Mr Mina (admin) or Tony Joseph (developer)'); 
                  }}
                >
                  Forgot your password?
                </a>
              </div>
              {/* Remove duplicate message display */}
            </div>

            {/* Show session expired message (highest priority) */}
            {sessionExpiredMessage && (
              <div style={{
                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                color: 'white',
                borderRadius: 8,
                padding: '12px 16px',
                margin: '16px 0 0 0',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.15)',
                textAlign: 'center',
                fontSize: '1rem',
                maxWidth: 400,
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 20 }}>⚠️</span> {sessionExpiredMessage}
              </div>
            )}

            {/* Show redirect message (only if no session expired message) */}
            {!sessionExpiredMessage && redirectMessage && (
              <div style={{
                background: 'linear-gradient(135deg, #17a2b8 0%, #20c997 100%)',
                color: 'white',
                borderRadius: 8,
                padding: '12px 16px',
                margin: '16px 0 0 0',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(23, 162, 184, 0.15)',
                textAlign: 'center',
                fontSize: '1rem',
                maxWidth: 400,
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 20 }}>🔒</span> {redirectMessage}
              </div>
            )}

            {/* Show error messages (only if no other messages) */}
            {!sessionExpiredMessage && !redirectMessage && (message || forgotMsg) && (
              <div style={{
                background: 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)',
                color: 'white',
                borderRadius: 8,
                padding: '12px 16px',
                margin: '16px 0 0 0',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(220, 53, 69, 0.15)',
                textAlign: 'center',
                fontSize: '1rem',
                maxWidth: 400,
                marginLeft: 'auto',
                marginRight: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: 20 }}>❗</span> 
                {forgotMsg ? (
                  <span>
                    Contact Mr Mina (admin) or Tony Joseph (
                      <a
                        href="/contact_developer"
                        style={{ 
                          color: 'white', 
                          textDecoration: 'underline', 
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          router.push('/contact_developer');
                        }}
                      >
                        developer
                      </a>
                      )
                    </span>
                  ) : (
                    message
                  )}
              </div>
            )}

            <button type="submit" className="login-btn" style={{ background: 'linear-gradient(90deg, #5F6DFE 0%, #6A82FB 100%)', fontWeight: 700, fontSize: '1.1rem', borderRadius: 12, marginTop: 10 }}>
              Continue
            </button>
          </form>

          <div className="footer-text">
            <p>TopPhysics Attendance System</p>
            <p>Copyright &copy; {new Date().getFullYear()} - TopPhysics</p>
          </div>
        </div>
      </div>
    </div>
  );
}