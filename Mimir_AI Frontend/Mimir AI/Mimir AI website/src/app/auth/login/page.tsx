"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/app/context/AuthContext';

const Login = () => {
  const router = useRouter();
  const { setUserEmail, setUserPassword } = useAuth();
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedPassword = localStorage.getItem('userPassword');
    
    if (storedEmail && storedPassword) {
      router.push('/auth/login/api');
    }
  }, [router]);

  const handleSendOtp = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://mimirai-rag.onrender.com/otp_generator', { "email": email });
      if (response.status === 200) {
        setOtpSent(true);
        toast.success('OTP sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      setError('Failed to send OTP. Please try again.');
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || !email) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://mimirai-rag.onrender.com/otp_auth', { "email": email, "otp": otp });
      if (response.data.status === true) {
        setOtpVerified(true);
        toast.success('OTP verified successfully!');
      } else {
        setError('Invalid OTP. Please try again.');
        toast.error('Invalid OTP');
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      setError('Failed to verify OTP. Please try again.');
      toast.error('Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpVerified) {
      setError('Please verify OTP first');
      toast.error('Please verify OTP first');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.post('https://mimirai-rag.onrender.com/login', {
        "email": email,
        "password": password
      });

      if (response.data.status === true) {
        setUserEmail(email);
        setUserPassword(password);
        
        toast.success('Login successful! Redirecting...');
        router.push('/auth/login/api');
      } else {
        setError(response.data.message);
        toast.error(response.data.message);
      }
    } catch (error: any) {
      console.error('Failed to login:', error);
      setError(error.response?.data?.message || 'Failed to login. Please try again.');
      toast.error(error.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gradient-to-r from-gray-800 via-gray-900 to-black">
      <div className="bg-gray-800 shadow-[5px_5px_0_rgb(59,130,246)] p-10 rounded-lg max-w-xs md:max-w-md md:grid md:grid-cols-1">
        {/* Header */}
        <h2 className="text-4xl font-extrabold text-white text-center mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-gray-400 text-sm mb-8">
          Only For Admin uses
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email and OTP section (always visible) */}
          <div className="mb-6">
            <label className="block text-gray-300 font-medium mb-2">Email</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your email"
                required
                disabled={otpSent}
              />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !email || otpSent}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Sending...' : otpSent ? 'Sent' : 'Send OTP'}
              </button>
            </div>
          </div>

          {/* OTP verification section */}
          {otpSent && !otpVerified && (
            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-2">OTP</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Enter OTP"
                  required
                />
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={loading || !otp}
                  className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </div>
          )}

          {/* Password Input - only shown after OTP verification */}
          {otpVerified && (
            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-600 bg-gray-700 text-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-[2px_2px_0_rgb(59,130,246)]"
                placeholder="Enter your password"
                required
              />
            </div>
          )}

          {error && (
            <div className="mb-4 text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          {/* Log In Button - only enabled when OTP is verified and password is entered */}
          <button
            type="submit"
            disabled={!otpVerified || !password}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold rounded-lg transform transition-transform duration-200 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-500 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Log In
          </button>
        </form>

        {/* Additional Options */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/auth/login/signup"
              className="text-blue-400 hover:underline"
            >
              Sign Up
            </Link>
          </p>
          <p className="mt-4 text-sm text-gray-400">
            Forgot your password?{" "}
            <Link
              href="/auth/login/reset"
              className="text-blue-400 hover:underline"
            >
              Reset Password
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
