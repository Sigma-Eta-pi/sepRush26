import { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Megaphone, Calendar, Users, Zap, GraduationCap, Settings, LogOut, Globe, ListTodo } from 'lucide-react';
import Updates from './dashboard/Updates';
import CalendarView from './dashboard/CalendarView';
import MemberProfiles from './dashboard/MemberProfiles';
import ConnectionsFinder from './dashboard/ConnectionsFinder';
import AlumniFinder from './dashboard/AlumniFinder';
import TasksView from './dashboard/TasksView';
import sepLogo from '@/images/sep-logo.png';

const AdminPanel = lazy(() => import('./dashboard/AdminPanel'));

const navItems = [
  { label: 'Updates', icon: Megaphone, href: '/dashboard/updates' },
  { label: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
  { label: 'Members', icon: Users, href: '/dashboard/members' },
  { label: 'My Tasks', icon: ListTodo, href: '/dashboard/tasks' },
  { label: 'Connections', icon: Zap, href: '/dashboard/connections' },
  { label: 'Alumni', icon: GraduationCap, href: '/dashboard/alumni' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();

  const path = location.replace(/^\/dashboard\/?/, '') || 'updates';

  const isActive = (href: string) => {
    if (href === '/dashboard/updates') {
      return location === '/dashboard' || location === '/dashboard/' || location.startsWith('/dashboard/updates');
    }
    return location.startsWith(href);
  };

  const roleBadgeColor = user?.role === 'exec'
    ? 'bg-yellow-400 text-yellow-900'
    : user?.role === 'admin'
      ? 'bg-red-500 text-white'
      : 'bg-slate-400 text-white';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (path) {
      case 'updates':
      case '':
        return <Updates />;
      case 'calendar':
        return <CalendarView />;
      case 'members':
        return <MemberProfiles />;
      case 'tasks':
        return <TasksView />;
      case 'connections':
        return <ConnectionsFinder />;
      case 'alumni':
        return <AlumniFinder />;
      case 'admin':
        return (
          <Suspense fallback={<div className="text-[#05006C]/50">Loading admin panel...</div>}>
            <AdminPanel />
          </Suspense>
        );
      default:
        return <Updates />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5F3EE]">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-full bg-[#05006C] flex flex-col">
        {/* Logo */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src={sepLogo} alt="SEP" className="w-9 h-9 object-contain" style={{ filter: 'brightness(10) contrast(10)', mixBlendMode: 'screen' }} />
            <div>
              <div className="text-[#EEEADE] font-bold text-sm tracking-widest">SIGMA ETA PI</div>
              <div className="text-[#EEEADE]/50 text-xs tracking-wider">EPSILON CHAPTER</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-3">
          {navItems.map(({ label, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all ${
                isActive(href)
                  ? 'text-[#EEEADE] bg-white/15'
                  : 'text-[#EEEADE]/70 hover:text-[#EEEADE] hover:bg-white/10'
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          {(user?.role === 'exec' || user?.role === 'admin') && (
            <Link
              href="/dashboard/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all ${
                isActive('/dashboard/admin')
                  ? 'text-[#EEEADE] bg-white/15'
                  : 'text-[#EEEADE]/70 hover:text-[#EEEADE] hover:bg-white/10'
              }`}
            >
              <Settings size={18} />
              {user?.role === 'admin' ? 'Admin Panel' : 'Exec Panel'}
            </Link>
          )}
        </nav>

        {/* User info + logout */}
        <div className="px-4 pb-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-[#EEEADE]/60 text-xs truncate">{user?.email}</div>
              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadgeColor}`}>
                {user?.role}
              </span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <Link
                href="/"
                className="text-[#EEEADE]/50 hover:text-[#EEEADE] transition-colors"
                title="Back to website"
              >
                <Globe size={18} />
              </Link>
              <button
                onClick={handleLogout}
                className="text-[#EEEADE]/50 hover:text-[#EEEADE] transition-colors cursor-pointer"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64 flex-1 min-h-screen p-8">
        {(path === 'updates' || path === '') && (
          <div className="mb-6 text-[#05006C]/60 text-lg">
            Welcome back, {user?.email}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
