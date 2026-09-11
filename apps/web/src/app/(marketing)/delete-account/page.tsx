import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Request Account Deletion - NePay',
  description: 'Submit a request to permanently delete your NePay account and data.',
};

export default function DeleteAccountPage() {
  return (
    <div className="max-w-4xl mx-auto pt-32 pb-16 px-5 sm:px-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-marketing-text mb-8 text-center sm:text-left">Account Deletion Request</h1>
      
      <div className="bg-marketing-surface border border-marketing-border rounded-2xl sm:rounded-3xl p-6 sm:p-12 shadow-sm text-marketing-text">
        <p className="text-lg mb-8 leading-relaxed opacity-90">
          We're sorry to see you go! If you wish to permanently delete your NePay account and all associated data, please read the important information below and submit a request.
        </p>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">What happens when you delete your account?</h2>
          <ul className="list-disc pl-5 space-y-2 opacity-80">
            <li>Your account profile, transaction history, and stored preferences will be permanently erased from our active servers.</li>
            <li>Any pending transactions must be settled before the deletion can be completed.</li>
            <li>You will forfeit any active bonuses or pending referral rewards.</li>
            <li>For legal and compliance reasons, we may be required to retain certain financial transaction records for a period dictated by law, even after your account is closed.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3">How to request deletion</h2>
          <p className="mb-4 opacity-80">
            To securely request account deletion, please send an email to our support team from the email address associated with your NePay account. Include the phrase <strong>"Account Deletion Request"</strong> in the subject line.
          </p>
          <a 
            href="mailto:support@nepay.app?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20NePay%20account%20associated%20with%20this%20email." 
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-700 transition-colors text-white font-bold"
          >
            Email Support to Delete Account
          </a>
        </section>

        <hr className="border-marketing-border mb-6" />

        <div className="text-sm opacity-70">
          <p>
            If you have the NePay app installed, you can also delete your account directly by navigating to <strong>Profile &gt; Security &gt; Delete Account</strong>.
          </p>
          <div className="mt-4">
            <Link href="/" className="text-violet-500 hover:underline font-medium">
              &larr; Return to NePay Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
