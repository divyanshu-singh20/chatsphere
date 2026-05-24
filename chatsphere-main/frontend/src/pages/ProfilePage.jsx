import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import FormField from '../components/FormField';
import { Input, PrimaryButton, Textarea } from '../components/ui';
import Avatar from '../components/Avatar';
import api from '../services/api';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: user?.fullName || '', bio: user?.bio || '', avatar: null });
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = new FormData();
      payload.append('fullName', form.fullName);
      payload.append('bio', form.bio);
      if (form.avatar) payload.append('avatar', form.avatar);
      const { data } = await api.put('/users/me', payload);
      const nextUser = { ...(user || {}), ...(data.user || {}) };
      setUser(nextUser);
      localStorage.setItem('chatsphere_user', JSON.stringify(nextUser));
      setForm((current) => ({
        ...current,
        fullName: nextUser.fullName || '',
        bio: nextUser.bio || '',
        avatar: null
      }));
      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Could not update profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="glass-panel rounded-3xl p-6 text-center">
          <Avatar src={user?.avatar} name={user?.fullName} size="xl" className="mx-auto" />
          <h2 className="mt-4 text-2xl font-semibold text-white">{user?.fullName}</h2>
          <p className="text-[var(--wa-text-secondary)]">{user?.username}</p>
          <p className="mt-4 rounded-2xl border border-[var(--wa-border)] bg-[var(--wa-card-hover)] p-4 text-sm text-[var(--wa-text-secondary)]">{user?.bio || 'Add a bio to personalize your profile.'}</p>
        </div>
        <form onSubmit={submit} className="glass-panel rounded-3xl p-6">
          <h3 className="text-xl font-semibold text-white">Profile details</h3>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FormField label="Full name"><Input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></FormField>
            <FormField label="Profile photo"><Input type="file" accept="image/*" onChange={(event) => setForm({ ...form, avatar: event.target.files?.[0] || null })} /></FormField>
            <FormField label="Bio" className="md:col-span-2"><Textarea rows={5} value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></FormField>
            <div className="md:col-span-2">
              <PrimaryButton disabled={busy} className="w-full md:w-auto">{busy ? 'Saving...' : 'Save changes'}</PrimaryButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}