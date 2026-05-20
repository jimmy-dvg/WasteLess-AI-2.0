"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import LogWasteButton from "@/features/waste/components/LogWasteButton";
import { deleteProductAction } from "../actions";

export default function ProductActions({
  productId,
  productName,
  quantity,
  unit,
}: {
  productId: string;
  productName: string;
  quantity: string;
  unit: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { addToast } = useToast();
  const quantityValue = Number(quantity);
  const canLogWaste = Number.isFinite(quantityValue) && quantityValue > 0;

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
      <LogWasteButton
        productId={productId}
        productName={productName}
        quantity={quantity}
        unit={unit}
        disabled={!canLogWaste || isPending}
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
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
