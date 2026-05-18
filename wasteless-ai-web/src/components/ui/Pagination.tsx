"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PaginationProps = {
  page: number;
  pageCount: number;
};

export default function Pagination({ page, pageCount }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  const updatePage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
      <p className="text-slate-500">
        Page <span className="font-semibold text-slate-900">{page}</span> of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updatePage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => updatePage(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Next
        </button>
      </div>
    </div>
  );
}
