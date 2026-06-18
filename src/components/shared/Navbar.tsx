'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Menu, Bell, User as UserIcon, LogOut } from 'lucide-react';

interface NavbarProps {
  toggleSidebar: () => void;
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { user, signOut } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white hidden sm:block">
          Welcome back, {user?.firstName || 'User'}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notifMenuRef}>
          <button 
            onClick={() => {
              setNotifDropdownOpen(!notifDropdownOpen);
              setUserDropdownOpen(false);
            }}
            className="relative p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
          >
            <Bell size={20} />
          </button>

          {/* Notification Dropdown */}
          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white dark:bg-gray-800 py-2 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="mx-auto h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No new notifications</p>
                  <p className="text-xs mt-1">You're all caught up!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button 
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setNotifDropdownOpen(false);
            }}
            className="flex items-center space-x-2 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-300 dark:border-gray-600">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserIcon size={16} className="text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-200 md:block">
              {user?.firstName} {user?.lastName}
            </span>
          </button>

          {/* Dropdown Menu */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{user?.role}</p>
              </div>
              <button
                onClick={() => {
                  setUserDropdownOpen(false);
                  signOut();
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
