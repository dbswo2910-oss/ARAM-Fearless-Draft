'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopBar() {
  const path = usePathname();
  const is = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
  return (
    <header className="topbar">
      <Link href="/" className="wordmark">N<i>O</i>IR</Link>
      <nav>
        <Link href="/" className={is('/') ? 'active' : ''}>캐릭터</Link>
        <Link href="/characters/new" className={is('/characters/new') ? 'active' : ''}>만들기</Link>
        <Link href="/settings" className={is('/settings') ? 'active' : ''}>설정</Link>
      </nav>
    </header>
  );
}
