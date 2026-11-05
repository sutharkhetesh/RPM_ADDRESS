"use client";
import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import Link from "next/link";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Pencil, Printer, Trash2, LoaderCircle, FileDown } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress } from "@/actions/address.actions";
import { Button } from "@/components/ui/button";
export function AddressActions({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const submitting = useRef(false);
  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon">
        <Link
          href={`/addresses/${id}/edit`}
          aria-label={`Edit ${name}`}
          title="Edit address"
        >
          <Pencil size={15} />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon">
        <Link
          href={`/addresses/${id}/print`}
          aria-label={`Print ${name}`}
          title="Print preview"
        >
          <Printer size={15} />
        </Link>
      </Button>
      <Button asChild variant="ghost" size="icon">
        <Link
          href={`/addresses/${id}/print?download=1`}
          aria-label={`Download PDF for ${name}`}
          title="Download PDF"
        >
          <FileDown size={15} />
        </Link>
      </Button>
      <AlertDialog.Root
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <AlertDialog.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${name}`}
            title="Delete address"
            className="text-muted-foreground hover:text-red-600"
          >
            <Trash2 size={15} />
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="dialog-overlay" />
          <AlertDialog.Content className="dialog-content">
            <div className="dialog-danger">
              <Trash2 size={22} />
            </div>
            <AlertDialog.Title className="text-xl font-semibold mb-3">
              Delete this address?
            </AlertDialog.Title>
            <AlertDialog.Description className="text-sm text-muted-foreground leading-6">
              The address for {name} will be permanently removed. This action
              cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3 mt-7">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" disabled={pending}>
                  Keep address
                </Button>
              </AlertDialog.Cancel>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    if (submitting.current) return;
                    submitting.current = true;
                    try {
                      const result = await deleteAddress(id);
                      if (result.success) {
                        setOpen(false);
                        toast.success("Address deleted");
                      } else toast.error(result.error);
                    } catch (error) {
                      unstable_rethrow(error);
                      toast.error(
                        "Unable to delete. Check your connection and try again.",
                      );
                    } finally {
                      submitting.current = false;
                    }
                  })
                }
              >
                {pending ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Deleting…
                  </>
                ) : (
                  "Delete address"
                )}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
