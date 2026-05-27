'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Tracker', path: '/tracker' },
    { name: 'Post-Mortems', path: '/postmortem' }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0B0F19]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                🏴‍☠️ AI SRE Suite
              </span>
            </Link>
          </div>

          {/* Links */}
          <div className="flex space-x-6">
            {navItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-sm font-medium transition-all duration-200 relative py-1 ${
                    isActive
                      ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
