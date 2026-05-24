type PageHeaderProps = {
  title: string;
  description: string;
  action?: React.ReactNode;
  eyebrow?: string;
  eyebrowClassName?: string;
};

export default function PageHeader({
  title,
  description,
  action,
  eyebrow = "WasteLessAI",
  eyebrowClassName = "text-emerald-700",
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className={`text-sm font-semibold uppercase tracking-normal ${eyebrowClassName}`}>{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
