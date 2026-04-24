import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
//Added for cross origin requests-----------
const api = axios.create({
  baseURL: API,
  withCredentials: true, // ✅ IMPORTANT
});

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined=loading, null=guest, object=authed
  const [otpEmail, setOtpEmail] = useState(null); // ✅ track OTP flow

  // ---------------- CHECK AUTH ----------------
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // ---------------- LOGIN ----------------
  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password }, { withCredentials: true });
    setUser(data);
    return data;
  };

  // ---------------- REGISTER ----------------
  const register = async (name, email, password) => {
    const { data } = await axios.post(`${API}/auth/register`, { name, email, password }, { withCredentials: true });
    // setUser(data);
    // ✅ DO NOT SET USER HERE
    if (data.needs_verification) {
      setOtpEmail(email);
    }
    return data;
  };

  // ---------------- VERIFY OTP ----------------
  const verifyOTP = async (email, otp) => {
    const { data } = await api.post("/auth/verify-otp", { email, otp });
    setOtpEmail(null); // Clear OTP flow
    return data;
  };

  // ---------------- RESEND OTP ----------------
  const resendOTP = async (email) => {
    return await api.post("/auth/resend-otp", { email });
  };

  // ---------------- LOGOUT ----------------
  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(data);
      return data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, checkAuth, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
