import SectionWrapper from "@/components/SectionWrapper";

export const metadata = {
  title: "Privacy Policy - WasteLessAI",
  description: "Our privacy policy outlines how we collect and protect your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <SectionWrapper className="pt-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
            Last updated: May 2026
          </p>

          <div className="space-y-8 text-slate-700 dark:text-slate-300">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                1. Introduction
              </h2>
              <p>
                WasteLessAI, referred to as we, us, and our, operates the WasteLessAI website
                and application. This page informs you of our policies regarding
                the collection, use, and disclosure of personal data when you use
                our Service and the choices you have associated with that data.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                2. Information Collection and Use
              </h2>
              <p>
                We collect several different types of information for various
                purposes to provide and improve our Service to you.
              </p>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4">
                Types of Data Collected:
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Personal Data:</strong> Email address, name, phone
                  number, address, etc.
                </li>
                <li>
                  <strong>Inventory Data:</strong> Items you add, expiration
                  dates, locations
                </li>
                <li>
                  <strong>Usage Data:</strong> Browser logs, IP address, pages
                  visited
                </li>
                <li>
                  <strong>Cookies and Tracking:</strong> Session cookies, analytics
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                3. Use of Data
              </h2>
              <p>WasteLessAI uses the collected data for various purposes:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide and maintain our Service</li>
                <li>To notify you about changes to our Service</li>
                <li>To provide customer support</li>
                <li>To gather analysis to improve our Service</li>
                <li>To monitor the usage of our Service</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                4. Security of Data
              </h2>
              <p>
                The security of your data is important to us but remember that
                no method of transmission over the Internet or method of
                electronic storage is 100% secure. While we strive to use
                commercially acceptable means to protect your Personal Data, we
                cannot guarantee its absolute security.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                5. Changes to This Privacy Policy
              </h2>
              <p>
                We may update our Privacy Policy from time to time. We will
                notify you of any changes by posting the new Privacy Policy on
                this page and updating the effective date at the top of this
                Privacy Policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                6. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy, please
                contact us at:
              </p>
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                <p>
                  Email:{" "}
                  <a href="mailto:privacy@wastelessai.com" className="text-emerald-600 hover:text-emerald-700">
                    privacy@wastelessai.com
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
