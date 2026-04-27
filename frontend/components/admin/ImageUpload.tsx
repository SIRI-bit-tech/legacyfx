import { UploadButton } from '@/utils/uploadthing';
import { useState } from 'react';
import { AlertModal } from '../shared/AlertModal';

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helperText?: string;
}

export function ImageUpload({ label, value, onChange, helperText }: Readonly<ImageUploadProps>) {
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info', title: string = 'Notice') => {
    setAlertConfig({
      isOpen: true,
      title,
      message,
      type,
    });
  };

  const closeAlert = () => {
    setAlertConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="space-y-2">
      <label className="block text-text-secondary text-[10px] font-black uppercase tracking-widest font-mono">
        {label}
      </label>
      
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative group w-20 h-20 rounded-lg border border-color-border overflow-hidden bg-bg-tertiary">
            <img src={value} alt="Preview" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-color-border hover:border-color-primary flex flex-col items-center justify-center">
            <UploadButton
              endpoint="imageUploader"
              onClientUploadComplete={(res: any) => {
                if (res?.[0]) {
                  const finalUrl = res[0].ufsUrl || res[0].url;
                  onChange(finalUrl);
                }
              }}
              onUploadError={(error: any) => {
                showAlert(error.message || 'The image upload failed. Please try again.', 'error', 'Upload Error');
              }}
              appearance={{
                button: "bg-transparent text-color-primary text-[8px] font-black uppercase tracking-widest p-0 h-auto w-auto after:hidden",
                allowedContent: "hidden"
              }}
              content={{
                button({ ready, isUploading, uploadProgress }) {
                  if (isUploading) return `${uploadProgress}%`;
                  if (ready) return "Upload";
                  return "Wait...";
                }
              }}
            />
          </div>
        )}

        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Or enter URL directly..."
            className="w-full bg-bg-tertiary border border-color-border text-text-primary rounded-lg px-3 py-2 text-sm focus:border-color-primary font-mono"
          />
          {helperText && (
            <p className="text-[10px] text-text-tertiary mt-1">{helperText}</p>
          )}
        </div>
      </div>

      <AlertModal 
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={closeAlert}
      />
    </div>
  );
}
