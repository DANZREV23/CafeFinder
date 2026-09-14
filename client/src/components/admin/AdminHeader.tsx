import React from 'react';
import { Menu, Bell, User, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-stone-200 sticky top-0 z-30 px-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:flex items-center gap-2 text-sm text-stone-500">
          <Link to="/" className="hover:text-amber-600 transition-colors">CafeFinder</Link>
          <span>/</span>
          <span className="font-medium text-stone-900">Admin</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden md:flex items-center bg-stone-100 rounded-full px-4 py-1.5 w-64 group focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
          <Search className="w-4 h-4 text-stone-400 group-focus-within:text-amber-600" />
          <input 
            type="text" 
            placeholder="Search everything..."
            className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 text-stone-700 placeholder:text-stone-400"
          />
        </div>

        <button className="p-2 text-stone-500 hover:bg-stone-100 rounded-full relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-stone-200 hidden sm:block mx-1"></div>

        <div className="flex items-center gap-3 pl-1">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-stone-900 leading-none mb-1">{user?.name}</p>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">Administrator</p>
          </div>
          
          <div className="relative group">
            <button className="flex items-center gap-2 p-0.5 rounded-full hover:bg-stone-100 transition-colors">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full object-cover border border-stone-200 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 border border-amber-200 shadow-sm">
                  <User className="w-4 h-4" />
                </div>
              )}
            </button>

            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">
                <User className="w-4 h-4" />
                Profile
              </Link>
              <div className="h-px bg-stone-100 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
