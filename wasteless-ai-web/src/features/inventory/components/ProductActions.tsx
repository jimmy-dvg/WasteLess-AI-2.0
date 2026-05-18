"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { deleteProductAction } from "../actions";

export default function ProductActions({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { addToast } = useToast();

  const handleDelete = () => {
    setOpen(false);
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.success) {
        addToast(result.error ?? "Unable to delete product", "error");
        return;
      }
      if (result.message) addToast(result.message, "success");
      router.push("/dashboard/inventory");
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
      >
        Delete
      </button>
      <ConfirmDialog
        open={open}
        title="Delete product?"
        description="This removes the item from your inventory."
        confirmLabel="Delete"
        onCancel={() => setOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
