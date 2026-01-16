import { useState, useEffect } from 'react';
import { Bell, Phone, Mail, MessageCircle, RefreshCw, IndianRupee } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { dashboardService } from '../services/api';
import type { Member } from '../types';
import { PACKAGE_LABELS } from '../types';

function getDaysUntilExpiry(endDate: string): number {
    const end = new Date(endDate);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function Reminders() {
    const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
    const [pendingMembers, setPendingMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState<string | null>(null);
    const [reminderType, setReminderType] = useState<'expiry' | 'payment'>('expiry');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expiring, pending] = await Promise.all([
                dashboardService.getExpiringMembers(),
                dashboardService.getPendingDues()
            ]);
            setExpiringMembers(expiring);
            setPendingMembers(pending);
        } catch (err) {
            console.error('Error fetching reminders:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSendReminder = async (memberId: string, channel: 'email' | 'sms' | 'whatsapp') => {
        setSending(`${memberId}-${channel}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSending(null);
        alert(`Reminder sent via ${channel}!`);
    };

    const displayMembers = reminderType === 'expiry'
        ? expiringMembers.map(m => ({ ...m, daysLeft: getDaysUntilExpiry(m.packageEnd) }))
        : pendingMembers.map(m => ({ ...m, daysLeft: getDaysUntilExpiry(m.packageEnd) }));

    const ReminderCard = ({ member }: { member: Member & { daysLeft: number } }) => (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="member-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                    {member.fullName.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                    <div className="member-name">{member.fullName}</div>
                    <div className="member-phone text-muted">{member.phone}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {reminderType === 'expiry' ? (
                        member.daysLeft < 0 ? (
                            <Badge variant="danger">Expired {Math.abs(member.daysLeft)}d</Badge>
                        ) : member.daysLeft <= 3 ? (
                            <Badge variant="danger">{member.daysLeft} days</Badge>
                        ) : (
                            <Badge variant="warning">{member.daysLeft} days</Badge>
                        )
                    ) : (
                        <div className="flex items-center gap-1 text-danger" style={{ fontWeight: 600 }}>
                            <IndianRupee size={14} />
                            {(member.balanceDue || 0).toLocaleString()}
                        </div>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                {reminderType === 'expiry' ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>Package: {PACKAGE_LABELS[member.packageType]}</span>
                        <span>Exp: {new Date(member.packageEnd).toLocaleDateString()}</span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Package: {PACKAGE_LABELS[member.packageType]}</span>
                        <span className="text-success">Paid: ₹{(member.amountPaid || 0).toLocaleString()}</span>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                {member.email && (
                    <Button
                        size="sm"
                        variant="secondary"
                        style={{ flex: 1 }}
                        onClick={() => handleSendReminder(member._id, 'email')}
                        disabled={sending === `${member._id}-email`}
                    >
                        <Mail size={14} />
                        {sending === `${member._id}-email` ? '...' : 'Email'}
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="secondary"
                    style={{ flex: 1 }}
                    onClick={() => handleSendReminder(member._id, 'sms')}
                    disabled={sending === `${member._id}-sms`}
                >
                    <Phone size={14} />
                    {sending === `${member._id}-sms` ? '...' : 'SMS'}
                </Button>
                {member.whatsapp && (
                    <Button
                        size="sm"
                        variant="secondary"
                        style={{ flex: 1 }}
                        onClick={() => handleSendReminder(member._id, 'whatsapp')}
                        disabled={sending === `${member._id}-whatsapp`}
                    >
                        <MessageCircle size={14} />
                        {sending === `${member._id}-whatsapp` ? '...' : 'WA'}
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">
                    <Bell style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={28} />
                    Reminders
                </h1>
                <Button variant="secondary" onClick={fetchData}>
                    <RefreshCw size={18} />
                    Refresh
                </Button>
            </div>

            {/* Reminder Type Switcher */}
            <div className="filter-group" style={{ marginBottom: '1.5rem', overflowX: 'auto', display: 'flex' }}>
                <button
                    className={`filter-btn ${reminderType === 'expiry' ? 'active' : ''}`}
                    onClick={() => setReminderType('expiry')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    📅 Expiry Reminders ({expiringMembers.length})
                </button>
                <button
                    className={`filter-btn ${reminderType === 'payment' ? 'active' : ''}`}
                    onClick={() => setReminderType('payment')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    💰 Payment Reminders ({pendingMembers.length})
                </button>
            </div>

            <Card>
                {loading ? (
                    <div className="empty-state">
                        <RefreshCw size={32} />
                        <p>Loading reminders...</p>
                    </div>
                ) : displayMembers.length === 0 ? (
                    <div className="empty-state">
                        <Bell size={48} />
                        <h3>No Reminders</h3>
                        <p className="text-muted">
                            {reminderType === 'expiry' ? 'No members expiring this week!' : 'No pending payments!'}
                        </p>
                    </div>
                ) : (
                    isMobile ? (
                        <div className="mobile-list">
                            {displayMembers.map(member => (
                                <ReminderCard key={member._id} member={member} />
                            ))}
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Member</th>
                                        <th>Package</th>
                                        {reminderType === 'expiry' ? (
                                            <>
                                                <th>Expiry</th>
                                                <th>Days Left</th>
                                            </>
                                        ) : (
                                            <>
                                                <th>Paid</th>
                                                <th>Balance Due</th>
                                            </>
                                        )}
                                        <th>Send Reminder</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayMembers.map((member) => (
                                        <tr key={member._id}>
                                            <td>
                                                <div className="member-info">
                                                    <div className="member-avatar">
                                                        {member.fullName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="member-name">{member.fullName}</div>
                                                        <div className="member-phone text-muted">{member.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{PACKAGE_LABELS[member.packageType]}</td>
                                            {reminderType === 'expiry' ? (
                                                <>
                                                    <td>{new Date(member.packageEnd).toLocaleDateString()}</td>
                                                    <td>
                                                        {member.daysLeft < 0 ? (
                                                            <Badge variant="danger">Expired {Math.abs(member.daysLeft)}d ago</Badge>
                                                        ) : member.daysLeft <= 3 ? (
                                                            <Badge variant="danger">{member.daysLeft} days</Badge>
                                                        ) : (
                                                            <Badge variant="warning">{member.daysLeft} days</Badge>
                                                        )}
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="text-success">₹{(member.amountPaid || 0).toLocaleString()}</td>
                                                    <td>
                                                        <div className="flex items-center gap-1 text-danger" style={{ fontWeight: 600 }}>
                                                            <IndianRupee size={14} />
                                                            {(member.balanceDue || 0).toLocaleString()}
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                            <td>
                                                <div className="flex gap-2">
                                                    {member.email && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleSendReminder(member._id, 'email')}
                                                            disabled={sending === `${member._id}-email`}
                                                        >
                                                            <Mail size={14} />
                                                            {sending === `${member._id}-email` ? '...' : 'Email'}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => handleSendReminder(member._id, 'sms')}
                                                        disabled={sending === `${member._id}-sms`}
                                                    >
                                                        <Phone size={14} />
                                                        {sending === `${member._id}-sms` ? '...' : 'SMS'}
                                                    </Button>
                                                    {member.whatsapp && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleSendReminder(member._id, 'whatsapp')}
                                                            disabled={sending === `${member._id}-whatsapp`}
                                                        >
                                                            <MessageCircle size={14} />
                                                            {sending === `${member._id}-whatsapp` ? '...' : 'WA'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </Card>
        </div>
    );
}
