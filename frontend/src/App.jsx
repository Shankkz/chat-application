import { useState, useEffect } from 'react';
import client from './api/client';
import Login from './modules/auth/Login';
import ChatLayout from './modules/chat/ChatLayout';
import { FullPageLoader } from './shared/Loader';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('chatUser');
    const storedToken = sessionStorage.getItem('chatToken');
    if (storedUser && storedToken) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const handleSendOtp = async (identifier, name) => {
    try {
      const { data } = await client.post('/auth/send-otp', { identifier, name });
      return data.otp;
    } catch (error) {
      console.error('Failed to send OTP', error);
      return { error: error.response?.data?.error || 'Failed to send OTP.' };
    }
  };

  const handleVerifyOtp = async (identifier, otp) => {
    try {
      const { data } = await client.post('/auth/verify-otp', { identifier, otp });
      const { user, token } = data;
      
      sessionStorage.setItem('chatUser', JSON.stringify(user));
      sessionStorage.setItem('chatToken', token);
      
      setCurrentUser(user);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('chatUser');
    sessionStorage.removeItem('chatToken');
    setCurrentUser(null);
  };

  const handleUpdateUser = (updatedUser) => {
    sessionStorage.setItem('chatUser', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  if (isLoading) return <FullPageLoader />;

  return (
    <div className="h-screen w-screen overflow-hidden bg-dark-900">
      {!currentUser ? (
        <Login onSendOtp={handleSendOtp} onVerifyOtp={handleVerifyOtp} />
      ) : (
        <ChatLayout 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser} 
        />
      )}
    </div>
  );
}

export default App;
