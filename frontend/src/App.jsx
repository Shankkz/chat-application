import { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import ChatLayout from './components/ChatLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = sessionStorage.getItem('chatUser');
    const storedToken = sessionStorage.getItem('chatToken');
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
      setToken(storedToken);
      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  }, []);

  const handleSendOtp = async (identifier, name) => {
    try {
      const response = await axios.post(`${API_URL}/auth/send-otp`, { identifier, name });
      const testOtp = response.data.otp;
      console.log('OTP received (for testing):', testOtp);
      return testOtp;
    } catch (error) {
      console.error('Failed to send OTP', error);
      // Return an object with the error so Login can display it
      const errMsg = error.response?.data?.error || 'Failed to send OTP. Please try again.';
      return { error: errMsg };
    }
  };

  const handleVerifyOtp = async (identifier, otp) => {
    try {
      const response = await axios.post(`${API_URL}/auth/verify-otp`, { identifier, otp });
      const { user, token: newToken } = response.data;
      
      sessionStorage.setItem('chatUser', JSON.stringify(user));
      sessionStorage.setItem('chatToken', newToken);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      setCurrentUser(user);
      setToken(newToken);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chatUser');
    sessionStorage.removeItem('chatToken');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setToken(null);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-neu-text bg-neu-bg">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-neu-bg">
      {!currentUser ? (
        <Login onSendOtp={handleSendOtp} onVerifyOtp={handleVerifyOtp} />
      ) : (
        <ChatLayout currentUser={currentUser} onLogout={handleLogout} token={token} />
      )}
    </div>
  );
}

export default App;
