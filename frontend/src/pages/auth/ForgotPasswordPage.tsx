import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../lib/api';

interface ForgotPasswordForm {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/forgot-password', data);
      
      if (response.data.success) {
        setSent(true);
        toast.success('Link đặt lại mật khẩu đã được gửi đến email của bạn');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Kiểm tra email</h2>
        <p className="text-gray-600 mb-6">
          Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn.
          <br />
          Link có hiệu lực trong 5 phút.
        </p>
        <Link to="/login" className="btn btn-primary">
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Quên mật khẩu</h2>
      <p className="text-gray-600 mb-6">
        Nhập email của bạn để nhận link đặt lại mật khẩu
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            {...register('email', {
              required: 'Email là bắt buộc',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email không hợp lệ',
              },
            })}
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="example@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary disabled:opacity-50"
        >
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/login" className="text-primary-600 font-medium hover:text-primary-700">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
};

export default ForgotPasswordPage;

