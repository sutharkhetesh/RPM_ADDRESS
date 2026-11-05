import Image from "next/image";
export function RpmBrand() {
  return (
    <span className="rpm-brand">
      <span className="rpm-logo-crop">
        <Image
          src="/rpm-logo-transparent.png"
          width={1446}
          height={1088}
          sizes="280px"
          alt="RPM Eyewear"
          priority
        />
      </span>
      <small>YOUR ADDRESS WORKSPACE</small>
    </span>
  );
}
