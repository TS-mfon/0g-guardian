import Link from "next/link";
import { WalletConnect } from "./WalletConnect";

export function SiteNav() {
  return (
    <header className="site-nav">
      <Link className="nav-brand" href="/">Agent.fun</Link>
      <nav>
        <Link href="/launch">Launch</Link>
        <Link href="/agents">Agents</Link>
        <Link href="/arena">Arena</Link>
        <Link href="/tasks">Tasks</Link>
        <Link href="/creator">Creator</Link>
        <Link href="/portfolio">Portfolio</Link>
        <Link href="/economy">Economy</Link>
        <Link href="/proofs">Proofs</Link>
        <Link href="/docs">Docs</Link>
      </nav>
      <WalletConnect compact />
    </header>
  );
}
