import SectionWrapper from "@/components/SectionWrapper";
import Button from "@/components/Button";

export const metadata = {
  title: "About WasteLessAI",
  description: "Learn about our mission to reduce food waste and save money for households worldwide.",
};

export default function AboutPage() {
  return (
    <>
      <SectionWrapper className="pt-20">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="space-y-6">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
              About WasteLessAI
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              We are on a mission to help households reduce food waste, save money,
              and make smarter decisions about what they eat.
            </p>
          </div>

          <div className="space-y-4 p-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <h2 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
              Our Mission
            </h2>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              To empower every household to make sustainable choices by providing
              intelligent tools that reduce food waste, decrease environmental
              impact, and save money on groceries.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Our Story
            </h2>
            <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                WasteLessAI was founded in 2023 by a team of environmental
                engineers and software developers who were frustrated by how much
                food their own families were wasting.
              </p>
              <p>
                We realized that most households lack visibility into what they
                have, where it is, and when it will expire. This simple gap in
                awareness leads to billions of dollars in wasted food every year.
              </p>
              <p>
                By combining AI with an intuitive interface, we created a
                platform that helps families reduce waste while saving money and
                eating better.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Sustainability",
                  description: "We prioritize environmental impact in everything we do.",
                },
                {
                  title: "Simplicity",
                  description: "Complex problems deserve simple, elegant solutions.",
                },
                {
                  title: "Transparency",
                  description: "We believe in honest communication with our users.",
                },
                {
                  title: "Innovation",
                  description: "We continuously push the boundaries of what is possible.",
                },
              ].map((value) => (
                <div key={value.title} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center space-y-4 py-12">
            <p className="text-slate-600 dark:text-slate-300">Ready to join our mission?</p>
            <Button variant="primary" size="lg">
              <a href="https://app.wastelessai.com/signup" target="_blank" rel="noopener noreferrer">
                Get Started Today
              </a>
            </Button>
          </div>
        </div>
      </SectionWrapper>
    </>
  );
}
