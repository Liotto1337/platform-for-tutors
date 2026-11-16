import Image from "next/image";
import Link from "next/link";
import logo from "./chronosphere-logo.png";

export function Brand({ href }: { href?: string }) {
  const image = <Image src={logo} alt="Chronosphere" sizes="224px" />;

  return href
    ? <Link className="brand" href={href}>{image}</Link>
    : <div className="brand">{image}</div>;
}
