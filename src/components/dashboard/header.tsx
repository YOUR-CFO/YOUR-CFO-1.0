'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, Settings, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  sidebarOpen?: boolean;
}

export function DashboardHeader({ onMenuToggle, sidebarOpen }: DashboardHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <header className="bg-white shadow-sm border-b px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
          
          {/* Search */}
          <div className="relative hidden md:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(!searchOpen)}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search...</span>
            </Button>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="mt-4 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search dashboard..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onBlur={() => setSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </header>
  );
}