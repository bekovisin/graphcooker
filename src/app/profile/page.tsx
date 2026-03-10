'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, EyeOff, Mail, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // Password change states
  const [pwdStep, setPwdStep] = useState<'idle' | 'sending' | 'code'>('idle');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  const initials = user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?';

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      await checkAuth();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleSendCode = async () => {
    setPwdStep('sending');
    try {
      const res = await fetch('/api/auth/profile/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send code');
      }

      toast.success('Verification code sent to your email');
      setPwdStep('code');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send code');
      setPwdStep('idle');
    }
  };

  const handleChangePassword = async () => {
    if (!code || code.length !== 6) {
      toast.error('Enter the 6-digit verification code');
      return;
    }
    if (!newPassword) {
      toast.error('Enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdStep('idle');
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Avatar + Role */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full text-white flex items-center justify-center text-2xl font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #FDBA74 0%, #F97316 50%, #EA580C 100%)' }}>
            {initials}
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{user.name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <span className={`inline-flex items-center mt-1.5 px-2 py-0.5 text-xs font-medium rounded-full ${
              user.role === 'admin'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role === 'admin' ? 'Admin' : 'Customer'}
            </span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Account Info</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Change Password</h2>
          <p className="text-sm text-gray-500">
            To change your password, we&apos;ll send a verification code to your email address.
          </p>

          {pwdStep === 'idle' && (
            <div className="flex justify-end">
              <button
                onClick={handleSendCode}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Verification Code
              </button>
            </div>
          )}

          {pwdStep === 'sending' && (
            <div className="flex justify-end">
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg opacity-50"
              >
                Sending code...
              </button>
            </div>
          )}

          {pwdStep === 'code' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="000000"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => { setPwdStep('idle'); setCode(''); setNewPassword(''); setConfirmPassword(''); }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendCode}
                    className="text-sm text-orange-500 hover:text-orange-600 transition-colors"
                  >
                    Resend code
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword || code.length !== 6}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    {savingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
