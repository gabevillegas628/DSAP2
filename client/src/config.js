// client/src/config.js
const config = {
    // This will automatically use the right URL in production
    API_BASE: process.env.REACT_APP_API_BASE || 
              (process.env.NODE_ENV === 'production' 
                ? '/api'  // In production, backend is on same domain
                : 'http://localhost:5000/api') // Local development
};

export default config;