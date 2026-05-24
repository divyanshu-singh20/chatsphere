import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { Input, PrimaryButton } from '../components/ui';
import api from '../services/api';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', notifications: true, darkMode: true });
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.put('/users/password', form);
      toast.success('Password changed');
      setForm({ ...form, currentPassword: '', newPassword: '' });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-2 lg:p-6">
      <form onSubmit={submit} className="glass-panel rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-white">Settings</h2>
        <div className="mt-6 space-y-5">
          <FormField label="Current password"><Input type="password" value={form.currentPassword} onChange={(event) => setForm({ ...form, currentPassword: event.target.value })} /></FormField>
          <FormField label="New password"><Input type="password" value={form.newPassword} onChange={(event) => setForm({ ...form, newPassword: event.target.value })} /></FormField>
          <label className="flex items-center justify-between rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-4 py-3 text-white"><span>Notifications</span><input type="checkbox" checked={form.notifications} onChange={(event) => setForm({ ...form, notifications: event.target.checked })} /></label>
          <label className="flex items-center justify-between rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] px-4 py-3 text-white"><span>Dark mode</span><input type="checkbox" checked={form.darkMode} onChange={(event) => setForm({ ...form, darkMode: event.target.checked })} /></label>
          <PrimaryButton disabled={busy} className="w-full">{busy ? 'Updating...' : 'Update password'}</PrimaryButton>
        </div>
      </form>
      <div className="glass-panel rounded-3xl p-6">
        <h2 className="text-xl font-semibold text-white">Privacy & account</h2>
        <p className="mt-3 text-[var(--wa-text-secondary)]">Block users, clear chats, and delete account are handled by backend endpoints and should be wired to dedicated actions here.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <PrimaryButton onClick={() => logout()} className="bg-rose-500 hover:bg-rose-400">Logout</PrimaryButton>
        </div>
      </div>
    </div>
  );
}