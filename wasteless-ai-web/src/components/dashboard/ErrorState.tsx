type ErrorStateProps = {
  title?: string;
  description?: string;
};

export default function ErrorState({
  title = "Dashboard data is unavailable",
  description = "Refresh the page in a moment. If the issue persists, check the database connection and environment variables.",
}: ErrorStateProps) {
  return (
    <section className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-rose-900">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-rose-800">{description}</p>
    </section>
  );
}
