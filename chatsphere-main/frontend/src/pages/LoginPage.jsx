import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { Input, PrimaryButton } from '../components/ui';
import { isValidEmailOrPhone } from '../utils/validators';

export default function LoginPage() {
  const { login, authBusy } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ identifier: '', password: '', rememberMe: true });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const notice = location.state?.notice;

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
      await login(form);
      navigate(location.state?.from?.pathname || '/app/chat', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Welcome back</h2>
        <p className="mt-2 text-[var(--wa-text-secondary)]">Sign in to your ChatSphere workspace.</p>
        {notice ? <p className="mt-4 rounded-2xl border border-[rgba(10,132,255,0.25)] bg-[rgba(10,132,255,0.12)] px-4 py-3 text-sm text-white">{notice}</p> : null}
      </div>
      <form onSubmit={submit} className="space-y-5">
        <FormField label="Email or phone" error={errors.identifier}>
          <Input value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} placeholder="name@example.com or +123456789" />
        </FormField>
        <FormField label="Password" error={errors.password}>
          <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter password" />
        </FormField>
        <div className="flex items-center justify-between text-sm text-[var(--wa-text-secondary)]">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.rememberMe} onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })} /> Remember me
          </label>
          <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[var(--wa-primary)]">{showPassword ? 'Hide' : 'Show'} password</button>
        </div>
        <PrimaryButton disabled={authBusy} className="w-full">{authBusy ? 'Signing in...' : 'Sign in'}</PrimaryButton>
        <div className="flex items-center justify-end text-sm text-[var(--wa-text-secondary)]">
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="hover:text-white">Admin login</Link>
            <Link to="/register" className="hover:text-white">Create account</Link>
          </div>
        </div>
      </form>
    </motion.div>
  );
}