'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';

const Header = () => {
  const { data: session } = useSession();
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

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            <Link href="/dashboard">
              <span className="text-2xl font-bold text-indigo-600 cursor-pointer">PadelClub OS</span>
            </Link>
          </div>

          {/* User Menu Section */}
          <div className="flex items-center">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 focus:outline-none"
                >
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`}
                    alt="User avatar"
                  />
                  <span className="hidden sm:inline text-gray-700 font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login">
                <span className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 cursor-pointer">
                  Iniciar Sesión
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;