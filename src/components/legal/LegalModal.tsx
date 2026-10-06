import React from 'react';
import { X, Shield, FileText, Mail } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-[#121212] rounded-t-[28px] sm:rounded-[28px] border border-black/[0.08] dark:border-white/[0.08] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
              {type === 'privacy' ? <Shield className="w-4 h-4 text-[#FF2D20]" /> : <FileText className="w-4 h-4 text-[#FF2D20]" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-black dark:text-white">
                {type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
              </h2>
              <div className="text-[11px] font-mono text-[#6E6E73] dark:text-[#8E8E93]">
                Effective Date: October 2026 • Lightbag
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-[#8E8E93] hover:text-black dark:hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs text-[#4A4A4A] dark:text-[#A0A0A0] leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">1. Overview</h3>
                <p>
                  This Privacy Policy explains how <strong>Lightbag</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the app&quot;) collects, uses, and protects your information when you use our mobile application and related web services. We are committed to safeguarding photographer privacy: <strong>we do not sell your personal data, we serve zero advertisements, and we do not engage in third-party tracking or behavioral profiling</strong>.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">2. Information We Collect</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong className="text-black dark:text-white">Account Information:</strong> When you register or sign in via Email/Password, Google Sign-In, or Sign in with Apple, we store your email address, photographer name, studio name, and profile photo.
                  </li>
                  <li>
                    <strong className="text-black dark:text-white">Vault & Production Content:</strong> Gear inventory details (brands, models, serial numbers, personal equipment notes), scheduled photoshoot dates and client names, dynamic packing lists, and moodboard concept images uploaded or imported by you.
                  </li>
                  <li>
                    <strong className="text-black dark:text-white">Approximate Location:</strong> When you use the Light &amp; Weather feature (solar golden hour, blue hour, and location forecasts), your device provides approximate geographic coordinates solely to compute solar azimuth and query weather data. Your coordinates are never logged or tracked.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">3. Purpose of Processing</h3>
                <p>
                  We collect and process your data strictly to deliver core application functionality: syncing your equipment vault across your devices, maintaining your photoshoot schedules, calculating solar angles and golden hours, and enabling offline access with cloud synchronization.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">4. Third-Party Service Providers</h3>
                <p>To provide secure cloud features, Lightbag integrates only with trusted service providers:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li><strong>Google Firebase (Cloud Firestore &amp; Firebase Authentication):</strong> User authentication and cloud data storage with encryption in transit and at rest.</li>
                  <li><strong>Open-Meteo API:</strong> Provides localized meteorological forecasts without collecting user identifiers.</li>
                  <li><strong>CineD Database:</strong> Provides verified technical camera and lens specifications.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">5. Account Deletion &amp; Data Rights</h3>
                <p>
                  In compliance with Apple App Store Review Guideline 5.1.1(v) and Google Play policies, you have complete control over your data. You may delete your account and all associated equipment records, scheduled shoots, checklists, moodboard images, and authentication credentials at any time directly within the app by navigating to <strong>Settings &gt; Account &gt; Delete Account &amp; Data</strong>. All stored data is immediately and permanently purged.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">6. Contact Support</h3>
                <p>
                  If you have any questions, feedback, or privacy inquiries regarding Lightbag, please contact our team directly at:
                </p>
                <a
                  href="mailto:melek.ben.moussa97@gmail.com"
                  className="inline-flex items-center gap-1.5 mt-1 font-mono text-[#FF2D20] hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>melek.ben.moussa97@gmail.com</span>
                </a>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">1. Acceptance of Terms</h3>
                <p>
                  By creating an account or using the <strong>Lightbag</strong> application, you agree to comply with and be bound by these Terms of Use. If you do not agree, do not use the application.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">2. Permitted Use</h3>
                <p>
                  Lightbag is provided for individual and studio photographers and videographers to catalog photography equipment, plan production shoots, organize packing checklists, and review ambient weather and solar conditions. You agree not to misuse the service, attempt unauthorized database access, or reverse engineer backend communications.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">3. User Content &amp; Ownership</h3>
                <p>
                  You retain all ownership and copyright rights to any photos, moodboard inspiration, equipment descriptions, and shoot schedules that you upload or input into Lightbag. We claim no ownership over your intellectual property.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">4. Third-Party Data &amp; Disclaimers</h3>
                <p>
                  Solar calculations, golden hour estimates, and weather forecasts are informational estimates computed via astronomical algorithms and public meteorological APIs. Photographers should always take appropriate on-location precautions. CineD equipment data and Lightbag Gear Database specs are provided as reference tools.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">5. Account Termination &amp; Deletion</h3>
                <p>
                  You may terminate your account at any time using the in-app &quot;Delete Account &amp; Data&quot; function. We reserve the right to suspend or terminate accounts that violate system security or integrity.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-black dark:text-white text-sm mb-1">6. Contact Information</h3>
                <p>
                  For inquiries or support regarding these terms, reach us at:
                </p>
                <a
                  href="mailto:melek.ben.moussa97@gmail.com"
                  className="inline-flex items-center gap-1.5 mt-1 font-mono text-[#FF2D20] hover:underline"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>melek.ben.moussa97@gmail.com</span>
                </a>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-black dark:bg-[#3A3A3C] text-white text-xs font-medium cursor-pointer active:scale-[0.97] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
