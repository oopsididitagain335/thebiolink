// app/[username]/ClientProfile.tsx (partial — only key changes)
'use client';
import { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify'; // ✅ Client-side DOMPurify is fine
// ... other imports

const generateQRWithLogo = async (url: string): Promise<string> => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`;
  // ... (as before)
};

export default function ClientProfile(props: ClientProfileProps) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  // ✅ Render background with GIF support
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* ✅ Background Logic: Banner > Video > GIF/Image > Theme */}
      {props.hasBanner ? (
        <div className="absolute inset-0 z-0 flex justify-center">
          <div className="w-full max-w-4xl">
            <img src={props.profileBanner} alt="" className="w-full h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent"></div>
          </div>
        </div>
      ) : props.pageBackground ? (
        /\.(mp4|webm|ogg)$/i.test(props.pageBackground) ? (
          <video
            className="absolute inset-0 z-0 object-cover w-full h-full"
            src={props.pageBackground}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={props.pageBackground}
            alt="Background"
            className="absolute inset-0 z-0 object-cover w-full h-full"
          />
        )
      ) : (
        <div className="absolute inset-0 z-0" style={{ background: getThemeBackground(props.theme) }} />
      )}

      <div className="absolute inset-0 bg-black/40 z-10"></div>

      {/* QR Button (floating) */}
      <button
        onClick={() => setShowQR(!showQR)}
        className="fixed bottom-4 right-4 z-30 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white p-2.5 rounded-full"
        aria-label="Show QR Code"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2z" />
        </svg>
      </button>

      {showQR && qrCode && (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded-2xl max-w-xs">
            <img src={qrCode} alt="QR Code" className="w-full" />
            <p className="text-center mt-2 text-sm text-gray-600">Scan to visit profile</p>
            <button
              onClick={() => setShowQR(false)}
              className="mt-3 w-full bg-gray-200 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rest of profile */}
      <div className="relative z-20 flex justify-center p-4 pt-16 min-h-screen">
        <div className="w-full max-w-md space-y-4">
          {props.layoutStructure.map(renderSection)}
          <div className="text-center text-gray-500 text-xs pt-4 border-t border-white/10 mt-4">
            <p className="mb-1">Powered by The BioLink</p>
            <a href="/" className="text-indigo-300 hover:text-indigo-200 hover:underline">Create your own</a>
          </div>
        </div>
      </div>
    </div>
  );
}
