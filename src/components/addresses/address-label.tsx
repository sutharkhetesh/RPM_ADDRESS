import { addressLines, type PrintableAddress } from "@/lib/print";
export function AddressLabel({
  address,
  billing,
}: {
  address: PrintableAddress;
  billing: boolean;
}) {
  return (
    <article className="print-label">
      <div className="label-header">{billing ? "BILL TO:" : "SHIP TO:"}</div>
      <div className="label-lines">
        {addressLines(address, billing).map((line, i) => (
          <p key={i} className={i === 0 ? "recipient-name" : ""}>
            {line}
          </p>
        ))}
      </div>
    </article>
  );
}
