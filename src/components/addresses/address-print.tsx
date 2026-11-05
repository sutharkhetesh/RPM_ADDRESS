"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, Printer, FileDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddressLabel } from "./address-label";
import {
  addressLines,
  printFormats,
  type PrintFormat,
  type PrintableAddress,
} from "@/lib/print";
export function AddressPrint({
  address,
  type,
  download,
}: {
  address: PrintableAddress;
  type: string;
  download: boolean;
}) {
  const [format, setFormat] = useState<PrintFormat>("a4"),
    [billing, setBilling] = useState(type === "BILLING"),
    [pending, start] = useTransition();
  function pdf() {
    start(async () => {
      try {
        const { jsPDF } = await import("jspdf"),
          f = printFormats[format],
          doc = new jsPDF({
            unit: "mm",
            format: [f.width, f.height],
            orientation: f.width > f.height ? "landscape" : "portrait",
          });
        const width = f.width - f.margin * 2;
        let y = f.margin + 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(f.font - 2);
        doc.setTextColor(80);
        doc.text(billing ? "BILL TO:" : "SHIP TO:", f.margin, y);
        y += 9;
        doc.setTextColor(20);
        for (const [i, line] of addressLines(address, billing).entries()) {
          doc.setFont("helvetica", i === 0 ? "bold" : "normal");
          doc.setFontSize(i === 0 ? f.font + 2 : f.font);
          const wrapped: string[] = doc.splitTextToSize(line, width);
          for (const part of wrapped) {
            if (y > f.height - f.margin) {
              doc.addPage([f.width, f.height]);
              y = f.margin + 4;
            }
            doc.text(part, f.margin, y);
            y += f.font * 0.3528 * 1.4;
          }
          y += 1;
        }
        doc.save(
          `address-${
            address.fullName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "") || "recipient"
          }-${billing ? "billing" : "shipping"}.pdf`,
        );
      } catch {
        toast.error("Unable to generate PDF. Please try again.");
      }
    });
  }
  const size = printFormats[format];
  return (
    <main className="print-workspace">
      <style>{`@media print { @page { size: ${size.width}mm ${size.height}mm; margin: 0; } .print-paper { width: ${size.width}mm !important; min-height: ${size.height}mm !important; padding: ${size.margin}mm !important; } }`}</style>
      <div className="print-controls">
        <Link href="/addresses" className="back-link">
          <ArrowLeft size={15} />
          Back to addresses
        </Link>
        <div className="page-heading">
          <div>
            <span className="eyebrow">RPM EYEWEAR · ADDRESS PREVIEW</span>
            <h1>
              {download
                ? "Download your address."
                : "A well-addressed delivery."}
            </h1>
            <p>Choose a format, check the details, and you’re ready.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={pdf} disabled={pending}>
              {pending ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              Download PDF
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={16} />
              Print address
            </Button>
          </div>
        </div>
        <div className="print-options">
          <label className="field">
            Paper format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as PrintFormat)}
            >
              {Object.entries(printFormats).map(([key, f]) => (
                <option value={key} key={key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Address purpose
            <select
              value={billing ? "billing" : "shipping"}
              onChange={(e) => setBilling(e.target.value === "billing")}
            >
              <option value="shipping">Shipping label</option>
              <option value="billing">Billing address</option>
            </select>
          </label>
          <p className="text-xs text-muted-foreground">
            For accurate sizing, print at 100% scale and disable browser headers
            and footers.
          </p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          PDF uses standard Latin fonts. For international scripts, use Print →
          Save as PDF.
        </p>
      </div>
      <div className="print-preview">
        <div className={`print-paper format-${format}`}>
          <AddressLabel address={address} billing={billing} />
        </div>
      </div>
    </main>
  );
}
