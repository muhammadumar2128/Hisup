'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  GraduationCap, 
  CreditCard, 
  Settings,
  Menu,
  X,
  Library,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  // Define navigation links based on roles
  const getNavLinks = () => {
    const role = user?.role || 'Student';
    const basePath = `/${role.toLowerCase()}`;

    const links = [
      { name: 'Dashboard', href: basePath, icon: LayoutDashboard },
    ];

    switch (role) {
      case 'Admin':
        links.push(
          { name: 'User Management', href: `${basePath}/users`, icon: Users },
          { name: 'Academics', href: `${basePath}/academics`, icon: GraduationCap },
          { name: 'Registrations', href: `${basePath}/registrations`, icon: BookOpen },
          { name: 'Finances', href: `${basePath}/finances`, icon: CreditCard },
          { name: 'System Logs', href: `${basePath}/logs`, icon: Settings }
        );
        break;
      case 'Faculty':
        links.push(
          { name: 'My Profile', href: `/faculty/profile`, icon: Users },
          { name: 'My Courses', href: `/faculty/courses`, icon: BookOpen },
          { name: 'Students', href: `/faculty/students`, icon: Users }
        );
        break;
      case 'Student':
        links.push(
          { name: 'My Profile', href: `${basePath}/profile`, icon: Users },
          { name: 'Academics', href: `${basePath}/academics`, icon: BookOpen },
          { name: 'Class Schedule', href: `${basePath}/schedule`, icon: LayoutDashboard },
          { name: 'Fee & Invoices', href: `${basePath}/fee`, icon: CreditCard },
          { name: 'Library', href: `${basePath}/library`, icon: Library }
        );
        break;
      case 'Finance':
        links.push(
          { name: 'Invoices', href: `${basePath}/invoices`, icon: CreditCard },
          { name: 'Payments', href: `${basePath}/payments`, icon: CreditCard },
          { name: 'Reports', href: `${basePath}/reports`, icon: LayoutDashboard }
        );
        break;
      case 'Librarian':
        links.push(
          { name: 'My Profile', href: `${basePath}/profile`, icon: Users },
          { name: 'Library Members', href: `${basePath}/members`, icon: ShieldCheck },
          { name: 'Catalog', href: `${basePath}/catalog`, icon: BookOpen },
          { name: 'Circulation', href: `${basePath}/circulation`, icon: Library },
          { name: 'Fines', href: `${basePath}/fines`, icon: CreditCard }
        );
        break;
    }
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">HiSUP</span>
          </Link>
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <Icon 
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    isActive ? 'text-blue-700 dark:text-blue-200' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300'
                  }`} 
                />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
