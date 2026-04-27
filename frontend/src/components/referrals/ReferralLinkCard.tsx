"use client";

import { COLORS } from "@/constants";
import { useState } from "react";

interface ReferralLinkCardProps {
  referralCode: string;
  referralLink: string;
  loading?: boolean;
}

export const ReferralLinkCard: React.FC<ReferralLinkCardProps> = ({
  referralCode,
  referralLink,
  loading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = `Join Legacy FX and start trading with me! Use my referral link: ${referralLink}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(referralLink);

    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], "_blank", "width=600,height=400");
    }
  };

  return (
    <div
      className="border rounded-2xl p-6 relative overflow-hidden"
      style={{
        backgroundColor: COLORS.bgSecondary,
        borderColor: COLORS.border,
      }}
    >
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <i className="pi pi-megaphone text-[120px]"></i>
      </div>

      <h3
        className="text-xl font-bold mb-4"
        style={{ color: COLORS.textPrimary }}
      >
        Your Referral Link
      </h3>

      {/* Link Display */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div
          className="flex-1 border rounded-xl px-4 py-3 flex items-center justify-between group"
          style={{
            backgroundColor: COLORS.bgTertiary,
            borderColor: COLORS.border,
          }}
        >
          <code
            className="text-sm break-all font-mono"
            style={{ color: COLORS.primary }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <i className="pi pi-spin pi-spinner text-xs"></i>
                <span>Generating link...</span>
              </span>
            ) : (
              referralLink || "No referral link available"
            )}
          </code>
          <button
            onClick={handleCopy}
            className="ml-3 p-2 transition-all"
            style={{
              color: copied ? COLORS.success : COLORS.textTertiary,
            }}
          >
            <i className={`pi ${copied ? "pi-check" : "pi-copy"}`}></i>
          </button>
        </div>
        <button
          onClick={handleCopy}
          disabled={loading || !referralLink}
          className="px-6 py-3 rounded-xl font-bold uppercase tracking-wider text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: copied ? COLORS.success : COLORS.primary,
            color: COLORS.bgPrimary,
          }}
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>

      {/* Share Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { platform: "twitter", icon: "pi-twitter", label: "Twitter" },
          { platform: "telegram", icon: "pi-telegram", label: "Telegram" },
          { platform: "whatsapp", icon: "pi-whatsapp", label: "WhatsApp" },
          { platform: "facebook", icon: "pi-facebook", label: "Facebook" },
        ].map((social) => (
          <button
            key={social.platform}
            onClick={() => handleShare(social.platform)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-semibold"
            style={{
              backgroundColor: COLORS.bgTertiary,
              borderColor: COLORS.border,
              color: COLORS.textPrimary,
            }}
          >
            <i className={`pi ${social.icon}`}></i>
            {social.label}
          </button>
        ))}
      </div>

      {/* Info Strip */}
      <div
        className="flex items-center gap-2 text-xs font-bold uppercase"
        style={{ color: COLORS.textTertiary }}
      >
        <i className="pi pi-info-circle"></i>
        <span>Commissions are paid out daily in USDT</span>
      </div>
    </div>
  );
};
