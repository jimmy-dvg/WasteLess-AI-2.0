import SectionWrapper from "@/components/SectionWrapper";

export const metadata = {
  title: "Terms of Service - WasteLessAI",
  description: "Read our terms of service and conditions of use.",
};

export default function TermsPage() {
  return (
    <>
      <SectionWrapper className="pt-20">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-8">
            Last updated: May 2026
          </p>

          <div className="space-y-8 text-slate-700 dark:text-slate-300">
            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                1. Terms
              </h2>
              <p>
                By accessing and using WasteLessAI, you accept and agree to be
                bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                2. Use License
              </h2>
              <p>
                Permission is granted to temporarily download one copy of the
                materials (information or software) on WasteLessAI for personal,
                non-commercial transitory viewing only. This is the grant of a
                license, not a transfer of title, and under this license you may
                not:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any
                  public display</li>
                <li>Attempting to decompile or reverse engineer any software
                  contained on the site</li>
                <li>Transferring the materials to another person or "mirroring"
                  the materials on any other server</li>
                <li>Removing any copyright or other proprietary notations from
                  the materials</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                3. Disclaimer
              </h2>
              <p>
                The materials on WasteLessAI's website are provided on an 'as
                is' basis. WasteLessAI makes no warranties, expressed or implied,
                and hereby disclaims and negates all other warranties including,
                without limitation, implied warranties or conditions of
                merchantability, fitness for a particular purpose, or
                non-infringement of intellectual property or other violation of
                rights.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                4. Limitations
              </h2>
              <p>
                In no event shall WasteLessAI or its suppliers be liable for any
                damages (including, without limitation, damages for loss of data
                or profit, or due to business interruption) arising out of the
                use or inability to use the materials on the WasteLessAI
                website, even if WasteLessAI or an authorized representative has
                been notified orally or in writing of the possibility of such
                damage.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                5. Accuracy of Materials
              </h2>
              <p>
                The materials appearing on the WasteLessAI website could include
                technical, typographical, or photographic errors. WasteLessAI
                does not warrant that any of the materials on the website are
                accurate, complete, or current.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                6. Links
              </h2>
              <p>
                WasteLessAI has not reviewed all of the sites linked to its
                website and is not responsible for the contents of any such
                linked site. The inclusion of any link does not imply
                endorsement by WasteLessAI of the site. Use of any such linked
                website is at the user's own risk.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                7. Modifications
              </h2>
              <p>
                WasteLessAI may revise these terms of service for the website at
                any time without notice. By using this website, you are agreeing
                to be bound by the then current version of these terms of
                service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                8. Governing Law
              </h2>
              <p>
                These terms and conditions are governed by and construed in
                accordance with the laws of the United States, and you
                irrevocably submit to the exclusive jurisdiction of the courts
                in that location.
              </p>
            </section>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
