'use client';

import { DashboardLayout } from '../dashboard-layout';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/constants';
import { GeneralTab } from './components/GeneralTab';
import { SecurityTab } from './components/SecurityTab';
import { TradingTab } from './components/TradingTab';
import { ComplianceTab } from './components/ComplianceTab';
import { TwoFAModal } from './components/TwoFAModal';
import { AlertModal } from '@/components/shared/AlertModal';

export default function SettingsPage() {
   const { user, refreshUser } = useAuth();
   const [activeTab, setActiveTab] = useState('General');
   const tabs = ['General', 'Security', 'Trading', 'Compliance', 'Notifications', 'API'];
   const [updating, setUpdating] = useState(false);
   const [updateSuccess, setUpdateSuccess] = useState(false);
   const [updateError, setUpdateError] = useState<string | null>(null);
   const [loginHistory, setLoginHistory] = useState<any[]>([]);
   const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
   const [showTwoFAModal, setShowTwoFAModal] = useState(false);
   const [twoFASetupData, setTwoFASetupData] = useState<any>(null);
   const [twoFACode, setTwoFACode] = useState('');

   // AlertModal state
   const [alertModal, setAlertModal] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      type: 'info' | 'success' | 'error' | 'warning' | 'danger';
      onConfirm?: () => void;
      confirmText?: string;
   }>({ isOpen: false, title: '', message: '', type: 'info' });

   const showAlert = useCallback((title: string, message: string, type: 'info' | 'success' | 'error' | 'warning' | 'danger' = 'info') => {
      setAlertModal({ isOpen: true, title, message, type });
   }, []);

   const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, confirmText = 'Confirm') => {
      setAlertModal({ isOpen: true, title, message, type: 'danger', onConfirm, confirmText });
   }, []);

   const closeAlert = useCallback(() => {
      setAlertModal(prev => ({ ...prev, isOpen: false }));
   }, []);

   useEffect(() => {
      if (activeTab === 'Security') {
         fetchSecurityData();
      }
   }, [activeTab]);

   const fetchSecurityData = async () => {
      try {
         const [historyRes, devicesRes] = await Promise.all([
            api.get(API_ENDPOINTS.AUTH.LOGIN_HISTORY),
            api.get(API_ENDPOINTS.AUTH.TRUSTED_DEVICES)
         ]);
         setLoginHistory(historyRes.data);
         setTrustedDevices(devicesRes.data);
      } catch (err) {
         console.error('Failed to fetch security data:', err);
      }
   };

   const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setUpdating(true);
      setUpdateSuccess(false);
      setUpdateError(null);

      const formData = new FormData(e.currentTarget);
      const data: any = {
         first_name: formData.get('first_name') as string,
         last_name: formData.get('last_name') as string,
         phone: formData.get('phone') as string,
         date_of_birth: formData.get('date_of_birth') ? new Date(formData.get('date_of_birth') as string).toISOString() : null,
         username: formData.get('username') as string,
         account_type: formData.get('account_type') as string,
      };

      // Add Trading Preferences
      if (formData.has('default_order_type')) data.default_order_type = formData.get('default_order_type');
      if (formData.has('default_lot_size')) data.default_lot_size = Number.parseFloat(formData.get('default_lot_size') as string);
      if (formData.has('default_leverage')) data.default_leverage = Number.parseInt(formData.get('default_leverage') as string);
      if (formData.has('slippage_tolerance')) data.slippage_tolerance = Number.parseFloat(formData.get('slippage_tolerance') as string);

      if (activeTab === 'Trading') {
         data.confirmation_dialogs = formData.get('confirmation_dialogs') === 'on';
         data.one_click_trading = formData.get('one_click_trading') === 'on';
      }

      // Add Legal & Compliance
      if (activeTab === 'Compliance') {
         data.tax_residency = formData.get('tax_residency') as string;
         data.data_sharing_enabled = formData.get('data_sharing_enabled') === 'on';
      }

      try {
         await api.put(API_ENDPOINTS.USERS.PROFILE, data);
         await refreshUser();
         setUpdateSuccess(true);
         setTimeout(() => setUpdateSuccess(false), 3000);
      } catch (err: any) {
         console.error('Update failed:', err);
         setUpdateError(err.response?.data?.detail || 'Failed to synchronize profile. Please check your connection.');
      } finally {
         setUpdating(false);
      }
   };

   const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = {
         current_password: formData.get('current_password') as string,
         new_password: formData.get('new_password') as string,
      };

      if (data.new_password !== formData.get('confirm_password')) {
         showAlert('Validation Error', 'Passwords do not match.', 'warning');
         return;
      }

      try {
         await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
         showAlert('Password Updated', 'Your password has been updated successfully.', 'success');
         e.currentTarget.reset();
      } catch (err: any) {
         showAlert('Password Error', err.response?.data?.detail || 'Failed to update password.', 'error');
      }
   };

   const handleSetup2FA = async () => {
      try {
         const res = await api.get(API_ENDPOINTS.AUTH.TWO_FA_SETUP);
         setTwoFASetupData(res.data);
         setShowTwoFAModal(true);
      } catch (err: any) {
         console.error('2FA Setup Error:', err);
         showAlert('2FA Setup Failed', err.response?.data?.detail || 'Failed to initialize 2FA setup. Please try again.', 'error');
      }
   };

   const handleEnable2FA = async () => {
      try {
         await api.post(API_ENDPOINTS.AUTH.TWO_FA_ENABLE, { code: twoFACode });
         setShowTwoFAModal(false);
         showAlert('2FA Enabled', 'Two-factor authentication has been enabled on your account.', 'success');
         setTimeout(() => globalThis.location.reload(), 1500);
      } catch (err: any) {
         console.error('2FA Enable Error:', err);
         showAlert('2FA Verification Failed', err.response?.data?.detail || 'Invalid verification code or setup expired.', 'error');
      }
   };

   const handleDisable2FA = async () => {
      const password = prompt('Enter password to disable 2FA');
      if (!password) return;

      try {
         await api.post(API_ENDPOINTS.AUTH.TWO_FA_DISABLE, { password });
         showAlert('2FA Disabled', '2FA has been disabled on your account.', 'success');
         setTimeout(() => globalThis.location.reload(), 1500);
      } catch (err: any) {
         console.error('2FA Disable Error:', err);
         showAlert('2FA Error', err.response?.data?.detail || 'Failed to disable 2FA. Please verify your password.', 'error');
      }
   };

   const handleRemoveDevice = async (id: string) => {
      try {
         await api.delete(`${API_ENDPOINTS.AUTH.TRUSTED_DEVICES}/${id}`);
         setTrustedDevices(prev => prev.filter(d => d.id !== id));
      } catch (err: any) {
         console.error('Revoke Device Error:', err);
         showAlert('Device Error', err.response?.data?.detail || 'Failed to revoke device access.', 'error');
      }
   };

   const handleDeleteAccount = () => {
      showConfirm(
         'Delete Account',
         'You are about to permanently delete your entire Prime Meridian Markets account. This will erase all trades, documents, and funds. This action is irreversible.',
         async () => {
            try {
               await api.delete('/users/account');
               localStorage.removeItem('token');
               globalThis.location.href = '/login';
            } catch (err: any) {
               showAlert('Deletion Failed', err.response?.data?.detail || 'Failed to delete account. Please contact support.', 'error');
            }
         },
         'Delete Permanently'
      );
   };

   const getKYCLabel = (status?: string) => {
      switch (status) {
         case 'VERIFIED': return 'Verified';
         case 'PENDING': return 'Pending';
         default: return 'Unverified';
      }
   };

   const getKYCStatusClass = (status?: string) => {
      switch (status) {
         case 'VERIFIED': return 'bg-color-success/10 text-color-success border-color-success/20';
         case 'PENDING': return 'bg-color-warning/10 text-color-warning border-color-warning/20';
         default: return 'bg-bg-tertiary text-text-tertiary border-color-border';
      }
   };

   const getTabIcon = (tab: string) => {
      switch (tab) {
         case 'General': return 'user';
         case 'Security': return 'shield';
         case 'Trading': return 'chart-line';
         case 'Compliance': return 'verified';
         case 'Notifications': return 'bell';
         default: return 'code';
      }
   };

   return (
      <DashboardLayout title="System Configuration" subtitle="Manage your institutional profile, terminal preferences, and security parameters.">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-12">
               {/* Sidebar Navigation */}
               <div className="w-full lg:w-64 space-y-2">
                  {tabs.map((tab) => (
                     <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 font-bold text-xs uppercase tracking-widest flex items-center gap-4 ${activeTab === tab
                              ? 'bg-color-primary text-bg-primary shadow-lg shadow-color-primary/20 scale-[1.02]'
                              : 'text-text-tertiary hover:bg-bg-secondary hover:text-text-primary'
                           }`}
                     >
                        <i className={`pi pi-${getTabIcon(tab)} text-lg`}></i>
                        {tab}
                     </button>
                  ))}
               </div>

               {/* Main Content Area */}
               <div className="flex-1">
                  {activeTab === 'General' && (
                     <GeneralTab
                        user={user}
                        updating={updating}
                        updateSuccess={updateSuccess}
                        updateError={updateError}
                        onUpdate={handleUpdateProfile}
                     />
                  )}

                  {activeTab === 'Security' && (
                     <SecurityTab
                        user={user}
                        loginHistory={loginHistory}
                        trustedDevices={trustedDevices}
                        onRemoveDevice={handleRemoveDevice}
                        onChangePassword={handleChangePassword}
                        onSetup2FA={handleSetup2FA}
                        onDisable2FA={handleDisable2FA}
                        onDeleteAccount={handleDeleteAccount}
                     />
                  )}

                  {activeTab === 'Trading' && (
                     <TradingTab
                        user={user}
                        updating={updating}
                        updateSuccess={updateSuccess}
                        updateError={updateError}
                        onUpdate={handleUpdateProfile}
                     />
                  )}

                  {activeTab === 'Compliance' && (
                     <ComplianceTab
                        user={user}
                        updating={updating}
                        updateSuccess={updateSuccess}
                        updateError={updateError}
                        onUpdate={handleUpdateProfile}
                        getKYCLabel={getKYCLabel}
                        getKYCStatusClass={getKYCStatusClass}
                     />
                  )}

                  {/* Placeholder for Notifications and API */}
                  {(activeTab === 'Notifications' || activeTab === 'API') && (
                     <div className="bg-bg-secondary border border-color-border rounded-3xl p-20 text-center animate-in fade-in duration-300 shadow-xl">
                        <i className="pi pi-lock text-5xl text-bg-tertiary mb-6 block"></i>
                        <h3 className="text-xl font-bold text-text-primary mb-2">{activeTab} Controls Under Review</h3>
                        <p className="text-sm text-text-secondary">Please contact your account manager for manual {activeTab.toLowerCase()} adjustments.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>

         <TwoFAModal
            show={showTwoFAModal}
            onClose={() => setShowTwoFAModal(false)}
            setupData={twoFASetupData}
            twoFACode={twoFACode}
            setTwoFACode={setTwoFACode}
            onEnable={handleEnable2FA}
         />

         <AlertModal
            isOpen={alertModal.isOpen}
            title={alertModal.title}
            message={alertModal.message}
            type={alertModal.type}
            onClose={closeAlert}
            onConfirm={alertModal.onConfirm}
            confirmText={alertModal.confirmText}
         />
      </DashboardLayout>
   );
}
