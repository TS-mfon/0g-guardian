import Link from "next/link";

export function SiteNav() {
  return (
    <header className="site-nav">
      <Link className="nav-brand" href="/">0G Guardian</Link>
      <nav>
        <Link href="/for-users">Users</Link>
        <Link href="/for-developers">Developers</Link>
        <Link href="/agents">Agents</Link>
        <Link href="/register">Register</Link>
        <Link href="/review">Review</Link>
        <Link href="/proofs">Proofs</Link>
      </nav>
    </header>
  );
}
