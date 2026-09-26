import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, ShoppingBag, History,
  Shield, LogOut, User, ChevronRight, Search, Bell, Sparkles,
  CheckCircle2, FileCode, Database, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { motion } from 'framer-motion';
import Logo from './Logo';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';
import OnboardingWizard from './OnboardingWizard';
import { NotificationItem } from '../../../shared/types';

const navItems = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects',    icon: FolderOpen,      label: 'Projects' },
  { to: '/quality',     icon: CheckCircle2,    label: 'Data Quality' },
  { to: '/api-testing', icon: FileCode,        label: 'API Testing' },
  { to: '/versions',    icon: Database,        label: 'Dataset Versions' },
  { to: '/marketplace', icon: ShoppingBag,     label: 'Marketplace' },
  { to: '/history',     icon: History,         label: 'History' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('dataforge_sidebar_collapsed') === 'true';
  });

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Welcome to MockForge AI 2.0',
      message: 'Explore automated semantic field inference & data quality metrics.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: '2',
      title: 'System Readiness',
      message: 'All worker engines (Node + Python microservice) online.',
      type: 'success',
      timestamp: new Date().toISOString(),
      read: false,
    },
  ]);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('dataforge_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Extract page title for breadcrumb
  const currentNav = navItems.find((n) => location.pathname.startsWith(n.to));
  const pageTitle = currentNav ? currentNav.label : location.pathname.includes('/editor') ? 'Schema Editor' : 'Workspace';

  return (
    <div className="app-layout bg-mesh" style={{ position: 'relative', display: 'flex', minHeight: '100vh' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <motion.aside
        className="sidebar"
        animate={{ width: collapsed ? 76 : 250 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        style={{
          padding: 0,
          minWidth: collapsed ? 76 : 250,
          overflow: 'hidden',
          position: 'relative',
          zIndex: 30,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Logo & Toggle Header */}
        <div
          style={{
            padding: collapsed ? '20px 12px' : '20px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            height: 68,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <Logo size={32} showText={!collapsed} />
          </div>

          <button
            onClick={toggleSidebar}
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {collapsed ? <PanelLeftOpen size={18} color="var(--primary-light)" /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 12,
                    padding: collapsed ? '12px 0' : '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive
                      ? 'linear-gradient(135deg, hsla(252,90%,66%,0.22), hsla(175,90%,50%,0.12))'
                      : 'transparent',
                    border: isActive ? '1px solid hsla(252,90%,66%,0.3)' : '1px solid transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={18} color={isActive ? 'var(--primary-light)' : undefined} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </span>
                  )}
                  {!collapsed && isActive && (
                    <ChevronRight size={14} style={{ marginLeft: 'auto', color: 'var(--primary-light)' }} />
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink to="/admin" style={{ textDecoration: 'none' }}>
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 12,
                    padding: collapsed ? '12px 0' : '9px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'hsla(355,88%,62%,0.15)' : 'transparent',
                    border: isActive ? '1px solid hsla(355,88%,62%,0.25)' : '1px solid transparent',
                    color: isActive ? 'var(--danger)' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 13.5,
                    cursor: 'pointer',
                  }}
                >
                  <Shield size={18} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>Admin Panel</span>}
                </motion.div>
              )}
            </NavLink>
          )}
        </nav>

        {/* User Profile Footer */}
        <div style={{ padding: '14px 10px', borderTop: '1px solid var(--border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '8px 0' : '10px 12px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User size={16} color="#fff" />
            </div>

            {!collapsed && (
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', display: 'flex' }}
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* ── Main View Content Area with Top Header ─────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Header Navbar */}
        <header
          style={{
            height: 68,
            borderBottom: '1px solid var(--border)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 20,
          }}
        >
          {/* Breadcrumb / Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
            <span style={{ color: 'var(--text-muted)' }}>MockForge AI</span>
            <span style={{ color: 'var(--border-strong)' }}>/</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pageTitle}</span>
          </div>

          {/* Quick Actions Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search Trigger Button */}
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 16px',
                color: 'var(--text-muted)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Search size={15} color="var(--primary-light)" />
              <span>Search workspace...</span>
              <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>⌘K</kbd>
            </button>

            {/* Onboarding Tour Button */}
            <button
              onClick={() => setIsOnboardingOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'hsla(252,90%,66%,0.15)',
                border: '1px solid hsla(252,90%,66%,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '6px 12px',
                color: 'var(--primary-light)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Sparkles size={15} />
              <span>Guided Tour</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              style={{
                position: 'relative',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 8,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
              }}
            >
              <Bell size={18} />
              {notifications.some((n) => !n.read) && (
                <span
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--primary)',
                  }}
                />
              )}
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="main-content page-enter" style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onClear={() => setNotifications([])}
      />
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
}
