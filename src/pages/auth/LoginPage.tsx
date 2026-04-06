import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { userAdminApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import type { ApiResponse } from '../../types/common';
import type { LoginResponse } from '../../types/auth';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await userAdminApi.post<ApiResponse<LoginResponse>>('/v1/auth/login', data);
      const { accessToken, refreshToken, userId, username, fullName, email, roles } = res.data.data;
      login({ userId, username, fullName, email, roles }, accessToken, refreshToken);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1B3A5C] rounded-xl mb-3">
            <Settings size={22} className="text-white" />
          </div>
          <h1 className="text-[22px] font-bold text-[#1A1A2E]">BankSoft CBS</h1>
          <p className="text-xs text-[#5A6A7A] mt-1">Internal Operations Portal</p>
        </div>

        {/* Card */}
        <div className="card shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1A1A2E] mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#A32D2D]/10 border border-[#A32D2D]/20">
              <p className="text-xs text-[#A32D2D]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                {...register('username')}
                placeholder="Enter username"
                className="input-field"
                autoComplete="username"
              />
              {errors.username && <p className="mt-1 text-[10px] text-[#A32D2D]">{errors.username.message}</p>}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#5A6A7A] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  className="input-field pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9BAB] hover:text-[#1A1A2E]"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[10px] text-[#A32D2D]">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#8A9BAB] mt-4">
          BankSoft CBS v1.0 • Internal Use Only
        </p>
      </div>
    </div>
  );
}
