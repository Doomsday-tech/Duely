import React from 'react';
import { ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onTryDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
  onTryDemo,
}) => {
  return (
    <div className="min-h-screen bg-[#F7F6F3] text-[#2C2C2C] flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-[#E2E0D9] px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-2xl font-semibold text-[#1C1C1E] tracking-tight">
            Duely
          </span>
          <span className="text-xs text-[#78716C] hidden sm:inline">
            Know what&apos;s due.
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <button
            onClick={onSignIn}
            className="text-[#57534E] hover:text-[#1C1C1E] transition-colors cursor-pointer"
          >
            Sign in
          </button>
          <button
            onClick={onTryDemo}
            className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C] px-3.5 py-1.5 rounded-[5px] transition-colors cursor-pointer"
          >
            Try demo
          </button>
          <button
            onClick={onGetStarted}
            className="bg-[#2C2C2C] text-[#F7F6F3] hover:bg-[#1C1C1E] px-4 py-1.5 rounded-[5px] transition-colors cursor-pointer"
          >
            Get started
          </button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-4xl mx-auto px-6 sm:px-12 py-20 sm:py-28 space-y-20 flex-1">
        <div className="space-y-6 max-w-3xl">
          <div className="text-xs uppercase tracking-wider text-[#8C827A] font-medium">
            Personal life &amp; expiry notebook
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl text-[#1C1C1E] leading-[1.12] font-normal">
            Know what&apos;s due before it becomes a problem.
          </h1>

          <p className="text-base sm:text-lg text-[#57534E] leading-relaxed font-sans max-w-2xl">
            A quiet, thoughtful notebook for your critical documents, insurance renewals, warranties, and identity certificates. Beautifully organized, without spreadsheet headaches or cluttered email searches.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-3 text-sm">
            <button
              onClick={onGetStarted}
              className="bg-[#2C2C2C] hover:bg-[#1C1C1E] text-[#F7F6F3] px-5 py-2.5 rounded-[5px] font-medium transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>Get started</span>
              <ArrowRight className="w-4 h-4 text-[#E2E0D9]" />
            </button>
            <button
              onClick={onTryDemo}
              className="border border-[#D6D3CC] hover:bg-[#EFECE6] text-[#2C2C2C] px-4 py-2.5 rounded-[5px] font-medium transition-colors cursor-pointer"
            >
              Open live demo
            </button>
          </div>
        </div>

        {/* The Natural Flow */}
        <section className="space-y-6 border-t border-[#E2E0D9] pt-12">
          <div className="text-xs uppercase tracking-wider text-[#8C827A] font-medium">
            How it works
          </div>
          <h2 className="font-serif text-2xl text-[#1C1C1E] font-medium">
            Four simple steps to peace of mind
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="border border-[#E2E0D9] bg-white p-5 rounded-[5px] space-y-2">
              <div className="text-xs text-[#8C827A] font-medium">Step 01</div>
              <div className="font-serif text-base font-medium text-[#1C1C1E]">Record entry</div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Add your car insurance, passport, lease, or warranty invoice in under 30 seconds.
              </p>
            </div>

            <div className="border border-[#E2E0D9] bg-white p-5 rounded-[5px] space-y-2">
              <div className="text-xs text-[#8C827A] font-medium">Step 02</div>
              <div className="font-serif text-base font-medium text-[#1C1C1E]">Automatic calculation</div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Duely calculates exact days remaining and separates urgent items from long-term ones.
              </p>
            </div>

            <div className="border border-[#E2E0D9] bg-white p-5 rounded-[5px] space-y-2">
              <div className="text-xs text-[#8C827A] font-medium">Step 03</div>
              <div className="font-serif text-base font-medium text-[#1C1C1E]">Advance reminders</div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Receive notifications 30, 14, or 7 days prior so you never scramble at the last moment.
              </p>
            </div>

            <div className="border border-[#E2E0D9] bg-white p-5 rounded-[5px] space-y-2">
              <div className="text-xs text-[#8C827A] font-medium">Step 04</div>
              <div className="font-serif text-base font-medium text-[#1C1C1E]">Renew &amp; archive</div>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Execute renewals with single-click links and preserve an unbroken historical trail.
              </p>
            </div>
          </div>
        </section>

        {/* Notebook Row Example */}
        <section className="border-t border-[#E2E0D9] pt-8 space-y-3 text-sm">
          <div className="text-xs uppercase tracking-wider text-[#8C827A] font-medium">
            Sample entry preview
          </div>

          <div className="border border-[#E2E0D9] bg-white p-5 rounded-[5px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-serif text-lg font-medium text-[#1C1C1E]">
                Comprehensive Motor Insurance
              </div>
              <div className="text-xs text-[#78716C]">
                HDFC ERGO &bull; Expires in 6 days &bull; Action: Renew online
              </div>
            </div>

            <button
              onClick={onTryDemo}
              className="bg-[#2C2C2C] text-[#F7F6F3] px-3.5 py-1.5 text-xs font-medium rounded-[5px] self-start sm:self-center cursor-pointer"
            >
              Renew entry
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E0D9] py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-[#78716C] gap-2">
        <div className="font-serif text-[#1C1C1E]">Duely &bull; Personal life notebook</div>
        <div>Private &bull; Multi-tenant row-level isolated</div>
      </footer>
    </div>
  );
};
