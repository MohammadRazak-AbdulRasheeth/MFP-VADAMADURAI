import { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Shield, Check, X, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { userService } from '../services/api';
import type { User } from '../types';

export function StaffManagement() {
    const [staff, setStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        phone: '',
        email: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch staff from API
    const fetchStaff = async () => {
        try {
            setLoading(true);
            const data = await userService.getAll();
            setStaff(data);
        } catch (err) {
            console.error('Error fetching staff:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            if (editingUser) {
                // Update existing staff
                await userService.update(editingUser._id, {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    ...(formData.password ? { password: formData.password } : {})
                });
            } else {
                // Create new staff
                await userService.create({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                });
            }

            // Refresh list and reset form
            await fetchStaff();
            setShowForm(false);
            setEditingUser(null);
            setFormData({ username: '', password: '', name: '', phone: '', email: '' });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error saving staff');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            name: user.name,
            phone: user.phone || '',
            email: user.email || '',
        });
        setShowForm(true);
        setError('');
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this staff member?')) {
            try {
                await userService.delete(id);
                await fetchStaff();
            } catch (err) {
                console.error('Error deleting staff:', err);
            }
        }
    };

    const toggleActive = async (user: User) => {
        try {
            await userService.update(user._id, { isActive: !user.isActive });
            await fetchStaff();
        } catch (err) {
            console.error('Error toggling status:', err);
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingUser(null);
        setFormData({ username: '', password: '', name: '', phone: '', email: '' });
        setError('');
    };

    const StaffCard = ({ user }: { user: User }) => (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '40px', height: '40px', fontSize: '1rem' }}>
                        {user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="member-name">{user.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            🏋️ Trainer
                        </div>
                    </div>
                </div>
                <Badge variant={user.isActive ? 'success' : 'danger'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
            </div>

            <div style={{ marginBottom: '1rem', display: 'grid', gap: '0.5rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Username:</span>
                    <code>{user.username}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                    <span>{user.phone || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                    <span>{user.email || '-'}</span>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleEdit(user)}>
                    <Edit size={14} style={{ marginRight: '0.25rem' }} /> Edit
                </button>
                <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => toggleActive(user)}
                >
                    {user.isActive ? <X size={14} style={{ marginRight: '0.25rem' }} /> : <Check size={14} style={{ marginRight: '0.25rem' }} />}
                    {user.isActive ? 'Disable' : 'Enable'}
                </button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(user._id)}>
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">
                    <Shield style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={28} />
                    Staff Management
                </h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={fetchStaff}>
                        <RefreshCw size={18} />
                        Refresh
                    </Button>
                    <Button onClick={() => { setShowForm(true); setEditingUser(null); setError(''); }}>
                        <UserPlus size={18} />
                        Add Staff
                    </Button>
                </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
                <Card className="mb-4">
                    <h4 style={{ marginBottom: '1rem' }}>{editingUser ? 'Edit Staff' : 'Add New Staff'}</h4>

                    {error && (
                        <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem' }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-row" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
                            <div className="form-group">
                                <label className="form-label">Username *</label>
                                <input
                                    type="text"
                                    name="username"
                                    className="form-input"
                                    placeholder="trainer_name"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled={!!editingUser}
                                    required
                                />
                                {!editingUser && (
                                    <small className="text-muted">Staff will use this to login</small>
                                )}
                            </div>
                            <div className="form-group">
                                <label className="form-label">{editingUser ? 'New Password (optional)' : 'Password *'}</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!editingUser}
                                />
                            </div>
                        </div>
                        <div className="form-row" style={{ flexDirection: isMobile ? 'column' : 'row' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="form-input"
                                    placeholder="Enter full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    placeholder="9876543210"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        <div className="form-group" style={{ maxWidth: isMobile ? '100%' : '50%' }}>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="staff@gym.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="flex gap-2" style={{ marginTop: '1rem' }}>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : (editingUser ? 'Update Staff' : 'Create Staff')}
                            </Button>
                            <Button type="button" variant="secondary" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Staff List */}
            <Card>
                {loading ? (
                    <div className="empty-state">
                        <RefreshCw size={32} className="animate-spin" />
                        <p>Loading staff...</p>
                    </div>
                ) : (
                    isMobile ? (
                        <div className="mobile-list">
                            {staff.map(user => (
                                <StaffCard key={user._id} user={user} />
                            ))}
                            {staff.length === 0 && (
                                <div className="empty-state">
                                    No staff members yet.
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Staff Member</th>
                                        <th>Username</th>
                                        <th>Contact</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((user) => (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="member-info">
                                                    <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="member-name">{user.name}</div>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            🏋️ Trainer
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <code style={{ background: 'var(--bg-card-hover)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                    {user.username}
                                                </code>
                                            </td>
                                            <td>
                                                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>{user.phone || '-'}</div>
                                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email || '-'}</div>
                                            </td>
                                            <td>
                                                <Badge variant={user.isActive ? 'success' : 'danger'}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button className="btn btn-icon" title="Edit" onClick={() => handleEdit(user)}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        className="btn btn-icon"
                                                        title={user.isActive ? 'Deactivate' : 'Activate'}
                                                        onClick={() => toggleActive(user)}
                                                    >
                                                        {user.isActive ? <X size={16} /> : <Check size={16} />}
                                                    </button>
                                                    <button className="btn btn-icon" title="Delete" onClick={() => handleDelete(user._id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {staff.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="empty-state">
                                                No staff members yet. Click "Add Staff" to create one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}
