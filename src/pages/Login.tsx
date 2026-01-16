import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import './Login.css';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loginType, setLoginType] = useState<'admin' | 'staff'>('admin');
    const { login, logout } = useAuth();
    const navigate = useNavigate();

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
            <div className="card login-card animate-in">
                <div className="login-header">
                    <div className="login-icon">
                        <img src="/MFP logo1.png" alt="MFP Unisex Gym" style={{ width: '100%', height: 'auto' }} />
                    </div>
                    <h2 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>MFP UNISEX GYM</h2>
                    <p className="text-muted" style={{ fontSize: '0.875rem' }}>Vadamadurai</p>
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
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem' }}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                {loginType === 'admin' && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                        <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: 'var(--primary)', fontWeight: 600 }}>
                            OWNER LOGIN
                        </p>
                        <p className="text-secondary" style={{ fontSize: '0.75rem' }}>
                            Please enter your credentials to access the owner dashboard.
                        </p>
                    </div>
                )}

                {loginType === 'staff' && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                        <p className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Staff accounts are created by the Owner. Contact your gym admin for login credentials.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
