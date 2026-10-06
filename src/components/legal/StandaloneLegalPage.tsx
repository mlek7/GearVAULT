import React from 'react';
import { Shield, FileText, ArrowLeft, Mail } from 'lucide-react';

interface StandaloneLegalPageProps {
  type: 'privacy' | 'terms';
  onBack?: () => void;
}

export const StandaloneLegalPage: React.FC<StandaloneLegalPageProps> = ({ type, onBack }) => {
  return (
    <div className="min-h-screen bg-[#FAFDFD] dark:bg-[#000000] text-black dark:text-white p-4 sm:p-8 flex flex-col justify-start max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (onBack) onBack();
            else window.location.href = '/';
          }}
          className="inline-flex items-center gap-2 text-xs font-mono text-[#6E6E73] dark:text-[#8E8E93] hover:text-black dark:hover:text-white py-2 px-3 rounded-full bg-[#EBEBEB] dark:bg-[#1E1E1E] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Lightbag</span>
        </button>
        <span className="text-[11px] font-mono text-[#FF2D20] font-semibold tracking-wider uppercase">
          Lightbag Legal
        </span>
      </div>

      <div className="bg-white dark:bg-[#121212] rounded-[32px] border border-black/[0.08] dark:border-white/[0.08] p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div className="w-10 h-10 rounded-2xl bg-[#EBEBEB] dark:bg-[#1E1E1E] flex items-center justify-center text-black dark:text-white">
            {type === 'privacy' ? <Shield className="w-5 h-5 text-[#FF2D20]" /> : <FileText className="w-5 h-5 text-[#FF2D20]" />}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {type === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
            </h1>
            <div className="text-xs font-mono text-[#6E6E73] dark:text-[#8E8E93] mt-0.5">
              Lightbag • Effective Date: October 2026
            </div>
          </div>
        </div>

        <div className="space-y-5 text-xs text-[#4A4A4A] dark:text-[#A0A0A0] leading-relaxed">
          {type === 'privacy' ? (
            <>
              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">1. Summary &amp; Principles</h2>
                <p>
                  <strong>Lightbag</strong> is committed to preserving the privacy of professional and enthusiast photographers. We respect the sensitivity of equipment catalogs, serial numbers, client schedules, and creative ideas. We do not sell your personal data, we show zero advertisements, and we do not track you across other applications or websites.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">2. Data We Collect</h2>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong className="text-black dark:text-white">User Profile Data:</strong> Email address, photographer display name, studio business name, and profile avatar (stored securely via Google Firebase Authentication &amp; Firestore).
                  </li>
                  <li>
                    <strong className="text-black dark:text-white">Equipment &amp; Vault Records:</strong> Cameras, lenses, lighting, audio, monitors, tripods, gimbals, and drones entered into your vault, including serial numbers, purchase notes, and specs.
                  </li>
                  <li>
                    <strong className="text-black dark:text-white">Photoshoots &amp; Checklists:</strong> Scheduled shoot times, client names, locations, and gear packing checklists.
                  </li>
                  <li>
                    <strong className="text-black dark:text-white">Moodboard Concepts:</strong> Reference photographs and concept notes curated for your shoots.
                  </li>
                  <li>
                    <strong className="text-black dark:text-white">Location Data:</strong> Used transiently on-device to query meteorological information via the Open-Meteo weather API and calculate golden hour times. Coordinates are never saved or tied to your identity on our servers.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">3. Cloud Providers &amp; Third Parties</h2>
                <p>
                  Data synchronization and authentication are powered by Google Cloud / Firebase (Firestore database with strict per-user access control rules). Technical gear lookups query the CineD database. Weather forecasts query Open-Meteo.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">4. Account &amp; Data Deletion (Apple Guideline 5.1.1(v))</h2>
                <p>
                  You may permanently delete your account and all associated Firestore documents, equipment inventories, shoot records, and images at any moment via the in-app <strong>Settings &gt; Account &gt; Delete Account &amp; Data</strong> button. All data is deleted irreversibly.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">5. Contact</h2>
                <p>
                  For any privacy questions or requests, contact the developer at:
                </p>
                <a
                  href="mailto:melek.ben.moussa97@gmail.com"
                  className="inline-flex items-center gap-1.5 font-mono text-[#FF2D20] hover:underline mt-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>melek.ben.moussa97@gmail.com</span>
                </a>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">1. Acceptance of Terms</h2>
                <p>
                  By creating an account or accessing <strong>Lightbag</strong>, you accept and agree to be bound by these Terms of Use.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">2. Permitted Use</h2>
                <p>
                  Lightbag is designed for photographers and cinematographers to manage equipment inventories, plan shoot schedules, and review solar conditions. You agree not to abuse the service, disrupt server infrastructure, or attempt unauthorized database queries.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">3. Content Ownership</h2>
                <p>
                  All content, images, checklists, and notes uploaded by you remain your intellectual property. Lightbag claims no rights or ownership over your photos or equipment data.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">4. Disclaimers</h2>
                <p>
                  Weather forecasts, sunrise/sunset times, and golden hour intervals are astronomical calculations and third-party meteorological estimates. Equipment specifications from CineD and Lightbag databases are provided for informational convenience.
                </p>
              </div>

              <div>
                <h2 className="font-semibold text-black dark:text-white text-sm mb-1">5. Contact</h2>
                <p>
                  For questions regarding these terms, email:
                </p>
                <a
                  href="mailto:melek.ben.moussa97@gmail.com"
                  className="inline-flex items-center gap-1.5 font-mono text-[#FF2D20] hover:underline mt-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>melek.ben.moussa97@gmail.com</span>
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
