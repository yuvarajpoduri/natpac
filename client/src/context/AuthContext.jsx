import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthenticationContext = createContext();

export const AuthenticationProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticationLoading, setIsAuthenticationLoading] = useState(true);

  useEffect(() => {
    const storedUserInformation = localStorage.getItem('natpac_user');
    const storedAuthenticationToken = localStorage.getItem('natpac_token');

    if (storedUserInformation && storedAuthenticationToken) {
      setCurrentUser(JSON.parse(storedUserInformation));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedAuthenticationToken}`;
    }
    setIsAuthenticationLoading(false);
  }, []);

  const loginUser = async (emailAddress, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        emailAddress,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem('natpac_token', token);
      localStorage.setItem('natpac_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const registerUser = async (fullName, emailAddress, password, userRole) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        fullName,
        emailAddress,
        password,
        userRole
      });

      const { token, user } = response.data;
      localStorage.setItem('natpac_token', token);
      localStorage.setItem('natpac_user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem('natpac_token');
    localStorage.removeItem('natpac_user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  return (
    <AuthenticationContext.Provider value={{ 
      currentUser, 
      isAuthenticationLoading, 
      loginUser, 
      registerUser, 
      logoutUser 
    }}>
      {children}
    </AuthenticationContext.Provider>
  );
};

export const useAuthentication = () => useContext(AuthenticationContext);
