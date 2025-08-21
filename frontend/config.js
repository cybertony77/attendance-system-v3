// API configuration
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port || '3000';

    // ✅ If frontend is served via ngrok (i.e., HTTPS and ngrok domain)
    if (window.location.href.includes('ngrok')) {
      // Return the same ngrok URL since API routes are now part of Next.js
      return window.location.origin;
    }

    // ✅ If accessed over local network
    if (hostname === '10.114.19.221' || hostname === '192.168.1.3') {
      return `http://${hostname}:${port}`;
    }

    // ✅ If localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}`;
    }
  }

  // Default fallback (SSR) - use localhost:3000 for Next.js
  return 'http://localhost:3000';
};

// Use a function instead of direct assignment to avoid SSR issues
export const getApiBaseUrl = () => {
  return getApiUrl();
};

// For debugging
export const debugApiUrl = () => {
  if (typeof window !== 'undefined') {
    console.log('Current URL:', window.location.href);
    console.log('Protocol:', window.location.protocol);
    console.log('Hostname:', window.location.hostname);
    console.log('API URL:', getApiUrl());
  }
};
