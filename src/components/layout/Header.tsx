'use client';

import { useSession, signOut } from 'next-auth/react';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut, Loader2 } from 'lucide-react';
import Link from 'next/link';

const Header = () => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderUserMenu = () => {
    // 1. Show a loading state
    if (status === 'loading') {
      return (
        <div className="flex items-center justify-center h-8 w-24 bg-gray-700 rounded-md animate-pulse" />
      );
    }

    // 2. Show the user menu if authenticated
    if (status === 'authenticated' && user) {
      return (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-700/50 focus:outline-none transition-colors"
          >
            <img
              className="h-9 w-9 rounded-full object-cover border-2 border-gray-600"
              src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=4f46e5&color=fff`}
              alt="User avatar"
            />
            <span className="hidden sm:inline text-white font-medium">{user.name}</span>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-1 z-10 border border-gray-700">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      );
    }

    // 3. Show a login button if unauthenticated
    return (
      <Link href="/login">
        <span className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 cursor-pointer">
          Iniciar Sesión
        </span>
      </Link>
    );
  };

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 sticky top-0 z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16">
          {/* User Menu Section */}
          <div className="flex items-center">
            {renderUserMenu()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;