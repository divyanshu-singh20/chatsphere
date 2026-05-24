import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { Input, PrimaryButton } from '../components/ui';
import { passwordStrength, required } from '../utils/validators';

const hasSpaces = (value) => /\s/.test(String(value || ''));

export default function RegisterPage() {
  const { register, authBusy } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    bio: '',
    avatar: null
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!required(form.fullName)) nextErrors.fullName = 'Full name is required';
    if (!required(form.username)) nextErrors.username = 'Username is required';
    else if (hasSpaces(form.username)) nextErrors.username = 'Username cannot contain spaces';
    if (!required(form.email)) nextErrors.email = 'Email is required';
    if (!required(form.phoneNumber)) nextErrors.phoneNumber = 'Phone number is required';
    if (!passwordStrength(form.password)) nextErrors.password = 'Use a strong password';
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) return;

    try {
      const hasAvatar = Boolean(form.avatar);
      const payload = hasAvatar ? new FormData() : { ...form };

      if (hasAvatar) {
        Object.entries(form).forEach(([key, value]) => {
          if (key === 'avatar') {
            if (value) payload.append('avatar', value);
            return;
          }

          if (value !== null && value !== undefined) {
            payload.append(key, value);
          }
        });
      }

      await register(payload);
      navigate('/app/chat', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl min-h-screen overflow-y-auto pb-24 px-2"
    >
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white">Create your ChatSphere account</h2>
        <p className="mt-2 text-[var(--wa-text-secondary)]">Set up your profile and start chatting.</p>
      </div>

      <form onSubmit={submit} className="grid gap-5 md:grid-cols-2 pb-32">
        <FormField label="Full name" error={errors.fullName}>
          <Input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} />
        </FormField>

        <FormField label="Username" error={errors.username}>
          <Input value={form.username} onChange={(e) => updateField('username', e.target.value)} />
        </FormField>

        <FormField label="Email" error={errors.email}>
          <Input value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="name@example.com" />
        </FormField>

        <FormField label="Phone number" error={errors.phoneNumber}>
          <Input value={form.phoneNumber} onChange={(e) => updateField('phoneNumber', e.target.value)} placeholder="+123456789" />
        </FormField>

        <FormField label="Password" error={errors.password} hint="8+ chars, upper, lower, number, symbol">
          <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => updateField('password', e.target.value)} />
        </FormField>

        <FormField label="Confirm password" error={errors.confirmPassword}>
          <Input type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} />
        </FormField>

        <FormField label="Bio" className="md:col-span-2">
          <Input value={form.bio} onChange={(e) => updateField('bio', e.target.value)} placeholder="Say something about yourself" />
        </FormField>

        <FormField label="Profile photo" className="md:col-span-2">
          <Input type="file" accept="image/*" onChange={(e) => updateField('avatar', e.target.files?.[0] || null)} />
        </FormField>

        <div className="md:col-span-2 flex items-center justify-between gap-4 text-sm text-[var(--wa-text-secondary)]">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showPassword} onChange={() => setShowPassword((value) => !value)} /> Show password
          </label>
          <Link to="/login" className="hover:text-white">Already have an account?</Link>
        </div>

        <div className="md:col-span-2">
          <PrimaryButton disabled={authBusy} className="w-full">
            {authBusy ? 'Registering...' : 'Create account'}
          </PrimaryButton>
        </div>
      </form>
    </motion.div>
  );
}
