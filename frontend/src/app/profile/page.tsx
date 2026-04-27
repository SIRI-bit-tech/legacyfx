'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    country: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Placeholder - would use actual API endpoint
        setProfile({
          email: 'user@example.com',
          username: 'trader123',
          first_name: 'John',
          last_name: 'Doe',
          kyc_status: 'verified',
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle profile update
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-text-primary mb-8">Profile Settings</h1>

        {profile && (
          <div className="space-y-8">
            {/* Account Info */}
            <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
              <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Account Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Email</label>
                  <p className="font-mono text-text-primary">{profile.email}</p>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Username</label>
                  <p className="font-mono text-text-primary">{profile.username}</p>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">KYC Status</label>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                    profile.kyc_status === 'verified' 
                      ? 'bg-color-success/20 text-color-success'
                      : 'bg-color-warning/20 text-color-warning'
                  }`}>
                    {profile.kyc_status.charAt(0).toUpperCase() + profile.kyc_status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">Member Since</label>
                  <p className="text-text-primary">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {/* Personal Info */}
            <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-2xl font-bold text-text-primary">Personal Information</h2>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-color-primary hover:text-color-primary-hover font-semibold"
                >
                  {editing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {!editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary text-sm mb-1">First Name</label>
                      <p className="text-text-primary">{profile.first_name || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-1">Last Name</label>
                      <p className="text-text-primary">{profile.last_name || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-1">Phone</label>
                    <p className="text-text-primary">-</p>
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-1">Country</label>
                    <p className="text-text-primary">-</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      className="px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary"
                      defaultValue={profile.first_name}
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      className="px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary"
                      defaultValue={profile.last_name}
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    className="w-full px-4 py-2 bg-bg-tertiary border border-color-border-light rounded text-text-primary"
                  />
                  <button
                    type="submit"
                    className="w-full bg-color-primary hover:bg-color-primary-hover text-bg-primary py-2.5 rounded font-semibold transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              )}
            </div>

            {/* Security */}
            <div className="bg-bg-secondary border border-color-border rounded-lg p-8">
              <h2 className="font-display text-2xl font-bold text-text-primary mb-6">Security</h2>
              <div className="space-y-4">
                <button className="w-full border border-color-border hover:bg-bg-tertiary text-text-primary py-2.5 rounded font-semibold transition-colors">
                  Change Password
                </button>
                <button className="w-full border border-color-border hover:bg-bg-tertiary text-text-primary py-2.5 rounded font-semibold transition-colors">
                  Enable 2-Factor Authentication
                </button>
                <button className="w-full border border-color-border hover:bg-bg-tertiary text-text-primary py-2.5 rounded font-semibold transition-colors">
                  Active Sessions
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-bg-secondary border border-color-danger rounded-lg p-8">
              <h2 className="font-display text-2xl font-bold text-color-danger mb-6">Danger Zone</h2>
              <button className="w-full border border-color-danger hover:bg-color-danger/10 text-color-danger py-2.5 rounded font-semibold transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
