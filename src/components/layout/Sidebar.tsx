import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Bell,
    FileText,
    CreditCard,
    LogOut,
    UserCircle,
    UserPlus,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
    const { user, logout, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    // Close sidebar when route changes (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [location.pathname]);

    // Close sidebar when clicking outside (mobile)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setIsOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Navigation items based on role
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
        { to: '/members', icon: Users, label: 'Members', adminOnly: false },
        { to: '/payments', icon: CreditCard, label: 'Payments', adminOnly: true },
        { to: '/reminders', icon: Bell, label: 'Reminders', adminOnly: true },
        { to: '/reports', icon: FileText, label: 'Reports', adminOnly: true },
        { to: '/staff', icon: UserPlus, label: 'Staff Management', adminOnly: true },
    ];

    // Filter nav items based on role
    const visibleNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

    return (
        <>
            {/* Mobile Menu Toggle Button */}
            <button
                className="mobile-menu-toggle"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            <div
                className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-logo">
                    <img src="/MFP logo1.png" alt="MFP Unisex Gym" style={{ height: '48px', width: 'auto' }} />
                </div>

                <nav className="sidebar-nav">
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                            end={item.to === '/'}
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                    <ThemeToggle />
                    <div className="nav-item" style={{ marginBottom: '0.5rem' }}>
                        <UserCircle size={20} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#E5E7EB' }}>{user?.name || 'User'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>
                                {user?.role === 'ADMIN' ? '👑 Owner' : '🏋️ Trainer'}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="nav-item"
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
