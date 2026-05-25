import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { Input, PrimaryButton } from '../components/ui';
import { isValidEmailOrPhone } from '../utils/validators';

export default function AdminLoginPage() {
  const { adminLogin, authBusy, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});

  if (!loading && user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const validate = () => {
    const nextErrors = {};
    if (!isValidEmailOrPhone(form.identifier)) nextErrors.identifier = 'Use a valid email or phone number';
    if (!form.password) nextErrors.password = 'Password is required';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      await adminLogin(form);
      navigate(location.state?.from?.pathname || '/admin/dashboard', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Admin login failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.36em] text-[var(--wa-primary)]">Admin access</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Sign in to moderation</h2>
        <p className="mt-2 text-[var(--wa-text-secondary)]">Use the admin account to review pending registrations.</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        <FormField label="Admin email" error={errors.identifier}>
          <Input value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder="admin@chatapp.com" />
        </FormField>
        <FormField label="Password" error={errors.password}>
          <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter password" />
        </FormField>
        <PrimaryButton disabled={authBusy} className="w-full">{authBusy ? 'Signing in...' : 'Open admin dashboard'}</PrimaryButton>
        <div className="flex items-center justify-between text-sm text-[var(--wa-text-secondary)]">
          <Link to="/login" className="hover:text-white">User login</Link>
          <span>Default admin is seeded automatically.</span>
        </div>
      </form>
    </motion.div>
  );
}
