import SectionWrapper from "@/components/SectionWrapper";

export const metadata = {
  title: "Terms of Service - WasteLessAI",
  description: "Read our terms of service and conditions of use.",
};

export default function TermsPage() {
  return (
    <SectionWrapper className="pt-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white">
          Terms of Service
        </h1>
        <p className="mb-8 text-sm text-slate-600 dark:text-slate-400">
          Last updated: May 2026
        </p>

        <div className="space-y-8 text-slate-700 dark:text-slate-300">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              1. Terms
            </h2>
            <p>
              By accessing and using WasteLessAI, you accept and agree to be
              bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              2. Use License
            </h2>
            <p>
              Permission is granted to temporarily download one copy of the
              materials on WasteLessAI for personal, non-commercial transitory
              viewing only. This is the grant of a license, not a transfer of
              title.
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>Do not modify or copy the materials.</li>
              <li>Do not use the materials for any commercial purpose or public display.</li>
              <li>Do not attempt to decompile or reverse engineer any software on the site.</li>
              <li>Do not transfer the materials to another person or mirror them on another server.</li>
              <li>Do not remove copyright or other proprietary notations.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              3. Disclaimer
            </h2>
            <p>
              The materials on the WasteLessAI website are provided on an as-is
              basis. WasteLessAI makes no warranties, expressed or implied, and
              disclaims all other warranties including merchantability, fitness
              for a particular purpose, and non-infringement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              4. Limitations
            </h2>
            <p>
              In no event shall WasteLessAI or its suppliers be liable for any
              damages arising out of the use or inability to use the materials
              on the WasteLessAI website, even if WasteLessAI has been notified
              of the possibility of such damage.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              5. Accuracy of Materials
            </h2>
            <p>
              The materials on the WasteLessAI website could include technical,
              typographical, or photographic errors. WasteLessAI does not
              warrant that any materials are accurate, complete, or current.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              6. Links
            </h2>
            <p>
              WasteLessAI has not reviewed all sites linked to its website and
              is not responsible for their contents. Use of any linked website
              is at the user&apos;s own risk.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              7. Modifications
            </h2>
            <p>
              WasteLessAI may revise these terms of service at any time without
              notice. By using this website, you agree to be bound by the
              current version of these terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              8. Governing Law
            </h2>
            <p>
              These terms and conditions are governed by and construed in
              accordance with the laws of the United States.
            </p>
          </section>
        </div>
      </div>
    </SectionWrapper>
  );
}
