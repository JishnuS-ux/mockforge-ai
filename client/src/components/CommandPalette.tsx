import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FolderOpen, PlusCircle, Cpu, Zap,
  CheckCircle2, FileCode, History, Sun, Moon, Sparkles, Database
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding?: () => void;
}

export default function CommandPalette({ isOpen, onClose, onOpenOnboarding }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  const commands = [
    {
      id: 'onboarding',
      label: 'Start Guided Onboarding Tour',
      category: 'Guided Tour',
      icon: Sparkles,
      action: () => {
        if (onOpenOnboarding) onOpenOnboarding();
      },
    },
    {
      id: 'projects',
      label: 'View All Projects',
      category: 'Navigation',
      icon: FolderOpen,
      action: () => navigate('/projects'),
    },
    {
      id: 'create-project',
      label: 'Create New Project',
      category: 'Actions',
      icon: PlusCircle,
      action: () => navigate('/projects?create=true'),
    },
    {
      id: 'dashboard',
      label: 'Go to Workspace Dashboard',
      category: 'Navigation',
      icon: Cpu,
      action: () => navigate('/dashboard'),
    },
    {
      id: 'quality',
      label: 'Open Data Quality Center',
      category: 'Testing',
      icon: CheckCircle2,
      action: () => navigate('/quality'),
    },
    {
      id: 'api-testing',
      label: 'Open API Testing Workspace',
      category: 'Testing',
      icon: FileCode,
      action: () => navigate('/api-testing'),
    },
    {
      id: 'versions',
      label: 'Open Dataset Versioning (Data-as-Code)',
      category: 'Data',
      icon: Database,
      action: () => navigate('/versions'),
    },
    {
      id: 'marketplace',
      label: 'Browse Schema Marketplace',
      category: 'Templates',
      icon: Zap,
      action: () => navigate('/marketplace'),
    },
    {
      id: 'history',
      label: 'View Generation & Export History',
      category: 'Navigation',
      icon: History,
      action: () => navigate('/history'),
    },
    {
      id: 'theme',
      label: `Switch to ${isDarkMode ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: isDarkMode ? Sun : Moon,
      action: () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="command-palette-overlay" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="command-palette"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: 20 }} />
            <input
              type="text"
              className="command-palette-input"
              style={{ paddingLeft: 52 }}
              placeholder="Type a command or search workspace... (Esc to close)"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              autoFocus
            />
          </div>

          {/* Command List */}
          <div style={{ maxHeight: 380, overflowY: 'auto', padding: '10px 0' }}>
            {filteredCommands.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                No commands matching "{query}"
              </div>
            ) : (
              filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={cmd.id}
                    className={`command-palette-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <Icon size={18} color="var(--primary-light)" />
                    <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{cmd.label}</span>
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {cmd.category}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Navigation Hints */}
          <div
            style={{
              padding: '10px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
            }}
          >
            <span>
              Press <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>⌘K</kbd> or <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4 }}>Ctrl+K</kbd> anytime
            </span>
            <span>MockForge AI 2.0 Command Center</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
