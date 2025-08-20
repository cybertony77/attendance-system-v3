import "@/styles/globals.css";
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getApiBaseUrl } from "../config";
import axios from "axios";
import Image from "next/image";

// Client-side redirect component
function ClientRedirect({ to }) {
  useEffect(() => {
    console.log("🔄 Client redirect to:", to);
    // Use replace to avoid adding to browser history
    window.location.replace(to);
  }, [to]);
  
  return <Preloader />;
}

// Preloader Component
function Preloader() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(380deg, #1FA8DC 0%, #FEB954 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <Image 
        src="/logo.png" 
        alt="TopPhysics Logo" 
        width={150}
        height={150}
        style={{
          objectFit: 'cover',
          background: 'transparent'
        }}
      />
    </div>
  );
}


function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true;
    // Check if token expires in the next 5 minutes (grace period)
    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    return timeUntilExpiry <= 300; // 5 minutes grace period
  } catch {
    return true;
  }
}

function getTokenExpiryTime(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function RedirectToLogin() {
  useEffect(() => {
    console.log("🚫 RedirectToLogin triggered - user not authenticated");
    
    // Check if session expired
    const sessionExpired = sessionStorage.getItem("session_expired");
    if (sessionExpired === "1") {
      console.log("⏰ Session expired, redirecting to login");
      sessionStorage.removeItem("session_expired");
    }
    
    // Store the current page for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== "/" && currentPath !== "/login") {
      console.log("📍 Storing redirect path:", currentPath);
      sessionStorage.setItem("redirectAfterLogin", currentPath);
    }
    
    // Use window.location.href directly to avoid router conflicts
    console.log("🔄 Redirecting to login page...");
    window.location.href = "/";
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255, 255, 255, 0.3)',
        borderTop: '4px solid #1FA8DC',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <div>🔒 Redirecting to login...</div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Immediate redirect component - bypasses React rendering
function ImmediateRedirect({ to }) {
  // Use a ref to ensure this only runs once
  const hasRedirected = useRef(false);
  
  useEffect(() => {
    if (!hasRedirected.current) {
      hasRedirected.current = true;
      console.log("🚀 Immediate redirect to:", to);
      
      // Use a more aggressive redirect approach
      try {
        // Try to use router.replace first
        router.replace(to);
      } catch (error) {
        console.log("⚠️ Router redirect failed, using window.location");
        // Fallback to window.location
        window.location.replace(to);
      }
    }
  }, [to]);
  
  return <Preloader />;
}

// Ultra-fast redirect component - renders nothing
function UltraFastRedirect({ to }) {
  useEffect(() => {
    console.log("⚡ Ultra-fast redirect to:", to);
    // Immediate redirect without any rendering
    window.location.replace(to);
  }, [to]);
  
  // Return null to avoid any rendering
  return null;
}

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define public pages using useMemo to prevent recreation on every render
  const publicPages = useMemo(() => ["/", "/404", "/contact_developer"], []);

  // Global navigation interceptor
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // This is just a safety measure
      return undefined;
    };

    const handlePopState = (e) => {
      // Handle browser back/forward buttons
      if (!isAuthenticated && !publicPages.includes(window.location.pathname)) {
        console.log("🚫 Browser navigation blocked to protected page");
        window.location.replace("/");
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAuthenticated, publicPages]);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = sessionStorage.getItem("token");
        console.log("🔍 Checking authentication...", { 
          hasToken: !!token, 
          currentPath: router.pathname,
          isPublicPage: publicPages.includes(router.pathname)
        });
        
        if (!token) {
          console.log("❌ No token found, user not authenticated");
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoading(false);
          return;
        }

        console.log("🔐 Token found, validating with server...");
        const response = await axios.get(`${getApiBaseUrl()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
          console.log("✅ Token validated successfully");
          setIsAuthenticated(true);
          setShowExpiryWarning(false);
          setAuthChecked(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("❌ Token validation error:", error);
        if (error.response?.status === 401) {
          // Token is invalid or expired
          console.log("🚫 Token invalid/expired, clearing and redirecting");
          setIsAuthenticated(false);
          setShowExpiryWarning(false);
          sessionStorage.removeItem("token");
          if (!publicPages.includes(router.pathname)) {
            const currentPath = window.location.pathname + window.location.search;
            console.log("📍 Storing redirect path for after login:", currentPath);
            sessionStorage.setItem("redirectAfterLogin", currentPath);
          }
        } else if (error.response?.status === 403) {
          // Token is about to expire
          console.log("⚠️ Token about to expire, showing warning");
          setIsAuthenticated(true);
          setShowExpiryWarning(true);
        } else {
          // For other errors, assume token might be valid
          console.log("⚠️ Other error, assuming token valid");
          setIsAuthenticated(true);
          setShowExpiryWarning(false);
        }
        setAuthChecked(true);
        setIsLoading(false);
      }
    };

    // Immediate check for faster authentication
    checkToken();

    // Reduce delay for faster authentication check
    const timer = setTimeout(() => {
      checkToken();
    }, 500);

    // Add a retry mechanism for race conditions
    const retryTimer = setTimeout(() => {
      if (!authChecked) {
        console.log("Retrying token check...");
        checkToken();
      }
    }, 2000);

    // Simple route change handlers without redirects
    router.events.on("routeChangeStart", (url) => {
      console.log("🔄 Route change started:", url);
      
      // Only set loading state, don't interfere with route changes
      setIsLoading(true);
    });
    
    router.events.on("routeChangeComplete", (url) => {
      console.log("✅ Route change completed:", url);
      setIsLoading(false);
    });
    
    router.events.on("routeChangeError", (err, url) => {
      console.error("❌ Route change error:", err, url);
      
      // Handle blocked routes gracefully
      if (err.message === 'Route blocked - not authenticated') {
        console.log("✅ Route blocked successfully, user redirected to login");
        return;
      }
      
      setIsLoading(false);
    });
    
    // Check token every minute for better responsiveness
    const interval = setInterval(() => {
      if (!isLoading && authChecked) {
        checkToken();
      }
    }, 60000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(retryTimer);
      router.events.off("routeChangeStart", checkToken);
      router.events.off("routeChangeComplete", checkToken);
      clearInterval(interval);
    };
  }, [router, isLoading, authChecked, publicPages]);
  
  // Simple redirect effect for unauthorized users
  useEffect(() => {
    if (authChecked && !isAuthenticated && !publicPages.includes(router.pathname)) {
      console.log("🚫 Unauthorized access detected, redirecting...");
      
      // Small delay to avoid conflicts
      const timer = setTimeout(() => {
        console.log("🔄 Executing redirect to login...");
        window.location.href = "/";
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [authChecked, isAuthenticated, router.pathname, publicPages]);
  
  // Role-based access is now handled at the page level for better UX
  
  // Show loading while checking authentication
  if (!authChecked || isLoading) {
    return <Preloader />;
  }
  
  // For unauthorized users, redirect to login page
  if (!isAuthenticated && !publicPages.includes(router.pathname)) {
    console.log("🚫 Unauthorized access, redirecting to login...");
    
    // Store the current path for redirect after login
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== "/" && currentPath !== "/login") {
      console.log("📍 Storing redirect path:", currentPath);
      sessionStorage.setItem("redirectAfterLogin", currentPath);
    }
    
    // Simple approach: just show loading and let the browser handle redirect
    // This prevents any React rendering conflicts
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        color: 'white',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255, 255, 255, 0.3)',
          borderTop: '4px solid #1FA8DC',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <div>🔒 Access Denied</div>
        <div style={{ fontSize: '1rem', opacity: 0.8 }}>Redirecting to login...</div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Only show Header/Footer if user has a token (is authenticated)
  if (!isAuthenticated) {
    return (
      <MantineProvider>
        <Component {...pageProps} />
      </MantineProvider>
    );
  }

  return (
    <MantineProvider>
      {showExpiryWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#ff6b6b',
          color: 'white',
          padding: '10px',
          textAlign: 'center',
          zIndex: 9999,
          fontWeight: 'bold'
        }}>
          ⚠️ Your session will expire soon. Please save your work and log in again.
        </div>
      )}
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <Header />
        <Component {...pageProps} />
        <Footer />
      </div>
    </MantineProvider>
  );
}
