'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UploadButton } from '@/utils/uploadthing';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import { DashboardLayout } from '../../dashboard-layout';
import {
  ShieldCheck,
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

type KYCStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';

interface VerificationState {
  status: KYCStatus;
  rejection_reason: string | null;
  loading: boolean;
}

export default function VerificationPage() {
  const { user } = useAuth();
  const [state, setState] = useState<VerificationState>({
    status: 'NOT_STARTED',
    rejection_reason: null,
    loading: true,
  });
  const [uploads, setUploads] = useState<{ 
    id: string | null; 
    address: string | null;
    business_license: string | null;
    articles: string | null;
    joint_agreement: string | null;
  }>({
    id: null,
    address: null,
    business_license: null,
    articles: null,
    joint_agreement: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchKYCStatus = async () => {
    try {
      const res = await api.get<{ status: KYCStatus; rejection_reason: string | null }>('/users/kyc/status');
      setState({
        status: res.status,
        rejection_reason: res.rejection_reason,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch KYC status', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const handleUploadComplete = async (type: string, url: string) => {
    try {
      await api.post('/users/kyc/upload', {
        document_type: type,
        file_url: url,
      });
      
      const mapping: Record<string, string> = {
        'ID_CARD': 'id',
        'PASSPORT': 'id',
        'DRIVERS_LICENSE': 'id',
        'PROOF_OF_ADDRESS': 'address',
        'BANK_STATEMENT': 'address',
        'BUSINESS_LICENSE': 'business_license',
        'ARTICLES_OF_ASSOCIATION': 'articles',
        'JOINT_OWNERSHIP_AGREEMENT': 'joint_agreement'
      };

      setUploads(prev => ({
        ...prev,
        [mapping[type]]: url
      }));
      toast.success(`${type.replace('_', ' ')} uploaded!`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error';
      toast.error(`Failed to register upload: ${errorMessage}`);
    }
  };

  const handleSubmit = async () => {
    const type = user?.account_type || 'INDIVIDUAL';
    let canSubmit = false;

    if (type === 'INDIVIDUAL') {
      canSubmit = !!(uploads.id && uploads.address);
    } else if (type === 'JOINT') {
      canSubmit = !!(uploads.id && uploads.address && uploads.joint_agreement);
    } else if (type === 'CORPORATE') {
      canSubmit = !!(uploads.business_license && uploads.articles && uploads.address);
    }

    if (!canSubmit) {
      toast.error('Please upload all required documents first.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/users/kyc/submit');
      toast.success('KYC submitted for verification!');
      fetchKYCStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to submit KYC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = {
    VERIFIED: {
      bg: 'bg-color-success/10 border-color-success/20',
      icon: <CheckCircle2 className="w-6 h-6 text-color-success shrink-0" />,
      text: 'Your account is fully verified. You have unrestricted access.'
    },
    PENDING: {
      bg: 'bg-color-warning/10 border-color-warning/20',
      icon: <Clock className="w-6 h-6 text-color-warning shrink-0" />,
      text: 'Your documents are being reviewed by our compliance team. This usually takes 12-24 hours.'
    },
    REJECTED: {
      bg: 'bg-color-danger/10 border-color-danger/20',
      icon: <XCircle className="w-6 h-6 text-color-danger shrink-0" />,
      text: `Reason: ${state.rejection_reason || 'Documents were unclear or invalid.'}`
    },
    NOT_STARTED: {
      bg: 'bg-bg-secondary border-color-border',
      icon: <AlertCircle className="w-6 h-6 text-color-primary shrink-0" />,
      text: 'Please upload the required documents below to begin the verification process.'
    }
  }[state.status] || {
    bg: 'bg-bg-secondary border-color-border',
    icon: <AlertCircle className="w-6 h-6 text-color-primary shrink-0" />,
    text: 'Please upload the required documents below to begin the verification process.'
  };

  if (state.loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-color-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-text-primary mb-2 flex flex-col md:flex-row items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-color-primary" />
            Identity Verification
          </h1>
          <p className="text-text-tertiary">
            Complete your KYC to unlock full account features including high-volume trading and withdrawals.
          </p>
        </div>

        {/* Status Banner */}
        <div className={`p-6 rounded-2xl border mb-8 flex items-start gap-4 ${statusConfig.bg}`}>
          {statusConfig.icon}

          <div>
            <h3 className="font-bold text-text-primary mb-1">
              Status: {state.status.replace('_', ' ')}
            </h3>
            <p className="text-sm text-text-tertiary">
              {statusConfig.text}
            </p>
          </div>
        </div>

        {state.status !== 'VERIFIED' && state.status !== 'PENDING' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Individual & Joint: Identity */}
              {(user?.account_type === 'INDIVIDUAL' || user?.account_type === 'JOINT') && (
                <div className={`bg-bg-secondary border rounded-2xl p-6 transition-all ${uploads.id ? 'border-color-success/50' : 'border-color-border'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-color-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-color-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    {uploads.id && <CheckCircle2 className="w-6 h-6 text-color-success" />}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Government ID</h3>
                  <p className="text-sm text-text-tertiary mb-6">
                    Passport, National ID, or Driver's License.
                  </p>
                  <UploadButton
                    endpoint="kycUploader"
                    onClientUploadComplete={(res) => handleUploadComplete('ID_CARD', res[0].ufsUrl)}
                    onUploadError={(error: Error) => {
                      toast.error(`Error: ${error.message}`);
                    }}
                  />
                </div>
              )}

              {/* Corporate: Business License */}
              {user?.account_type === 'CORPORATE' && (
                <div className={`bg-bg-secondary border rounded-2xl p-6 transition-all ${uploads.business_license ? 'border-color-success/50' : 'border-color-border'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-color-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-color-primary">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    {uploads.business_license && <CheckCircle2 className="w-6 h-6 text-color-success" />}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Business License</h3>
                  <p className="text-sm text-text-tertiary mb-6">
                    Valid operational license for your jurisdiction.
                  </p>
                  <UploadButton
                    endpoint="kycUploader"
                    onClientUploadComplete={(res) => handleUploadComplete('BUSINESS_LICENSE', res[0].ufsUrl)}
                    onUploadError={(error: Error) => {
                      toast.error(`Error: ${error.message}`);
                    }}
                  />
                </div>
              )}

              {/* Corporate: Articles of Association */}
              {user?.account_type === 'CORPORATE' && (
                <div className={`bg-bg-secondary border rounded-2xl p-6 transition-all ${uploads.articles ? 'border-color-success/50' : 'border-color-border'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-color-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-color-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    {uploads.articles && <CheckCircle2 className="w-6 h-6 text-color-success" />}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Articles of Association</h3>
                  <p className="text-sm text-text-tertiary mb-6">
                    Constitution or founding documents of the entity.
                  </p>
                  <UploadButton
                    endpoint="kycUploader"
                    onClientUploadComplete={(res) => handleUploadComplete('ARTICLES_OF_ASSOCIATION', res[0].ufsUrl)}
                    onUploadError={(error: Error) => {
                      toast.error(`Error: ${error.message}`);
                    }}
                  />
                </div>
              )}

              {/* Joint: Joint Ownership Agreement */}
              {user?.account_type === 'JOINT' && (
                <div className={`bg-bg-secondary border rounded-2xl p-6 transition-all ${uploads.joint_agreement ? 'border-color-success/50' : 'border-color-border'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-color-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-color-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    {uploads.joint_agreement && <CheckCircle2 className="w-6 h-6 text-color-success" />}
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2">Joint Ownership Agreement</h3>
                  <p className="text-sm text-text-tertiary mb-6">
                    Signed agreement between all account owners.
                  </p>
                  <UploadButton
                    endpoint="kycUploader"
                    onClientUploadComplete={(res) => handleUploadComplete('JOINT_OWNERSHIP_AGREEMENT', res[0].ufsUrl)}
                    onUploadError={(error: Error) => {
                      toast.error(`Error: ${error.message}`);
                    }}
                  />
                </div>
              )}

              {/* All: Proof of Address */}
              <div className={`bg-bg-secondary border rounded-2xl p-6 transition-all ${uploads.address ? 'border-color-success/50' : 'border-color-border'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-color-primary/10 w-12 h-12 rounded-xl flex items-center justify-center text-color-primary">
                    <Upload className="w-6 h-6" />
                  </div>
                  {uploads.address && <CheckCircle2 className="w-6 h-6 text-color-success" />}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">Proof of Address</h3>
                <p className="text-sm text-text-tertiary mb-6">
                  Utility bill or bank statement from the last 3 months.
                </p>
                <UploadButton
                  endpoint="kycUploader"
                  onClientUploadComplete={(res) => handleUploadComplete('PROOF_OF_ADDRESS', res[0].ufsUrl)}
                  onUploadError={(error: Error) => {
                    toast.error(`Error: ${error.message}`);
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-12 py-4 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  isSubmitting ? 'bg-bg-tertiary text-text-tertiary cursor-not-allowed' : 'bg-color-primary text-white hover:bg-color-primary/90 shadow-lg shadow-color-primary/20'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
                Submit for Verification
              </button>
            </div>
          </div>
        )}

        {/* Requirements List */}
        <div className="mt-12">
          <h4 className="text-lg font-bold text-text-primary mb-4">Tips for successful verification:</h4>
          <ul className="space-y-3">
            {[
              'All four corners of the document must be visible.',
              'Text must be clear and readable (not blurry).',
              'Documents must be valid (not expired).',
              'Photos should be in color and without flash glare.'
            ].map((tip) => (
              <li key={tip} className="flex items-center gap-3 text-sm text-text-tertiary">
                <div className="w-1.5 h-1.5 rounded-full bg-color-primary shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
