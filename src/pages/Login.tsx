import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Eye, EyeOff, Download, Share } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import './Login.css';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginType, setLoginType] = useState<'admin' | 'staff'>('admin');
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    // PWA Install State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallButton, setShowInstallButton] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    // Check if app is installed and listen for install prompt
    useEffect(() => {
        // Check if running as standalone PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone);

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Show install button for iOS if not installed
        if (isIOSDevice && !isStandalone) {
            setShowInstallButton(true);
        }

        // Listen for beforeinstallprompt (Android/Chrome)
        const handleBeforeInstall = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallButton(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', () => {
            setShowInstallButton(false);
            setIsInstalled(true);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowInstallButton(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const user = await login(username, password);

            // Enforce Role Separation
            if (loginType === 'admin' && user.role !== 'ADMIN') {
                logout();
                throw new Error('Access Denied: Owners Only area.');
            }

            if (loginType === 'staff' && user.role !== 'STAFF') {
                // If an Admin tries to login as Staff, we technically could allow it, 
                // but user requested "staff use only staff side". 
                // We'll restrict it to strictly STAFF role for this tabs.
                // Or if user.role is ADMIN, maybe allow? 
                // Let's stick to strict separation as requested.
                // Except usually Admins ARE Staff. But let's assume 'STAFF' role.
                if (user.role !== 'ADMIN') { // Fallback, maybe Admin can enter Staff area? 
                    // Let's enforce strict:
                }
                logout();
                throw new Error('Access Denied: Staff Only area.');
            }

            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle Tab Change
    const handleLoginTypeChange = (type: 'admin' | 'staff') => {
        setLoginType(type);
        setUsername('');
        setPassword('');
        setError('');
    };

    return (
        <div className="login-page">
            <div className="login-split-screen animate-in">
                {/* Brand Section (Desktop) */}
                <div className="login-brand-section">
                    <div className="brand-content">
                        <h1>MFP <span className="text-gold">FITNESS</span></h1>
                        <p>Forging Champions in Vadamadurai. Experience the premium standard of fitness.</p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="login-form-section">
                    <div className="card login-card">
                        <div className="login-header">
                            <div className="login-icon">
                                <img src="/mfp_vadamadurai_nobg_logo.png" alt="MFP Unisex Gym" />
                            </div>
                            <h2>Welcome Back</h2>
                            <p className="text-muted">Sign in to your account</p>
                        </div>

                        {/* Login Type Switcher */}
                        <div className="flex gap-2" style={{ marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                className={`filter-btn ${loginType === 'admin' ? 'active' : ''}`}
                                onClick={() => handleLoginTypeChange('admin')}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <Shield size={16} />
                                Owner
                            </button>
                            <button
                                type="button"
                                className={`filter-btn ${loginType === 'staff' ? 'active' : ''}`}
                                onClick={() => handleLoginTypeChange('staff')}
                                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <User size={16} />
                                Trainer
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="badge badge-danger" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', display: 'block', textAlign: 'center' }}>
                                    {error}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        style={{ paddingRight: '40px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            color: 'gray',
                                            cursor: 'pointer',
                                            padding: 0,
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <Button type="submit" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
                                {isLoading ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>

                        {loginType === 'admin' && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                                <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                                    OWNER LOGIN
                                </p>
                                <p className="text-secondary" style={{ fontSize: '0.75rem' }}>
                                    Please enter your credentials to access the owner dashboard.
                                </p>
                            </div>
                        )}

                        {loginType === 'staff' && (
                            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px' }}>
                                <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    Staff accounts are created by the Owner. Contact your gym admin for login credentials.
                                </p>
                            </div>
                        )}

                        {/* Install App Button - Only shows if not installed */}
                        {showInstallButton && !isInstalled && (
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15), rgba(212, 175, 55, 0.05))',
                                borderRadius: '8px',
                                border: '1px solid rgba(212, 175, 55, 0.3)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <Download size={20} style={{ color: '#D4AF37' }} />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#D4AF37' }}>
                                        Install MFP Gym App
                                    </span>
                                </div>

                                {isIOS ? (
                                    <div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                            To install on iPhone:
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            <span>1. Tap</span>
                                            <Share size={14} style={{ color: '#D4AF37' }} />
                                            <span>Share button</span>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                            2. Select "Add to Home Screen"
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInstallClick}
                                        style={{
                                            width: '100%',
                                            padding: '0.625rem 1rem',
                                            background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: '#000',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Download size={16} />
                                        Install App
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
