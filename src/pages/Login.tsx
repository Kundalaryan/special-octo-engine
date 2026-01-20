import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, Phone, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';
import api from '../api/axios';
import type { LoginRequest, LoginResponse } from '../types/auth';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // 1. Setup Form Handling
  const { register, handleSubmit, formState: { errors } } = useForm<LoginRequest>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. Setup API Mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      // We post to /auth/login as per your requirement
      const response = await api.post<LoginResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (response) => {
      if (response.success) {
        // Save token and redirect
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        navigate('/dashboard'); // We will build this page next
      } else {
        setErrorMessage(response.message || 'Login failed');
      }
    },
    onError: (error: AxiosError<{ message: string }>) => {
      const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
      setErrorMessage(msg);
    }
  });

  const onSubmit = (data: LoginRequest) => {
    setErrorMessage(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 font-sans">

      {/* Logo Section */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
          <ShoppingBag size={24} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">FreshCart Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Management Portal Access</p>
      </div>

      {/* Card Section */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign In</h2>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-100">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Phone Field (Mapped to API requirement) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Phone size={18} />
                </div>
                <input
                  {...register("phone", { required: "Phone number is required" })}
                  type="text"
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800 placeholder-gray-400"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">Forgot Password?</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  {...register("password", { required: "Password is required" })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Sign In <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        © 2024 FreshCart Systems. All rights reserved.
      </div>
    </div>
  );
};

export default Login;