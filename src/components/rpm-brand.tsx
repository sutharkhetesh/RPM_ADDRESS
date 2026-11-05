import Image from "next/image";
export function RpmBrand() {
  return (
    <span className="rpm-brand">
      <span className="rpm-logo-crop">
        <Image
          src="/rpm-logo.png"
          width={1191}
          height={896}
          alt="RPM Eyewear"
          priority
        />
      </span>
      <small>YOUR ADDRESS WORKSPACE</small>
    </span>
  );
}
