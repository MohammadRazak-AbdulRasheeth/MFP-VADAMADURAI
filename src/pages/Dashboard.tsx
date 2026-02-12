import { useState, useEffect } from 'react';
import { Users, TrendingUp, AlertTriangle, XCircle, Bell, Plus, IndianRupee, AlertCircle, RefreshCw, UserPlus, RotateCcw, Calendar } from 'lucide-react';
import { StatCard, Card } from '../components/ui/Card';
import { LinkButton } from '../components/ui/Button';
import { getStatusBadge } from '../components/ui/Badge';
import { AnalyticsCharts } from '../components/ui/AnalyticsCharts';
import { useAuth } from '../context/AuthContext';
import { dashboardService, memberService } from '../services/api';
import type { Member, DashboardStats } from '../types';
import { PACKAGE_LABELS } from '../types';

function getDaysUntilExpiry(endDate: string): number {
    const end = new Date(endDate);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
}

export function Dashboard() {
    const { isAdmin } = useAuth();
    const [stats, setStats] = useState<DashboardStats & { unverifiedMembersCount: number, recentAdmissions: Member[] }>({
        totalMembers: 0,
        activeMembers: 0,
        expiringThisWeek: 0,
        expiredMembers: 0,
        totalCollected: 0,
        totalPending: 0,
        membersWithDues: 0,
        unverifiedMembersCount: 0,
        recentAdmissions: [],
        newMembersThisMonth: 0,
        renewedMembersThisMonth: 0,
    });
    const [expiringMembers, setExpiringMembers] = useState<Member[]>([]);
    const [unverifiedMembers, setUnverifiedMembers] = useState<Member[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, expiringData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getExpiringMembers()
            ]);
            setStats(statsData);
            setExpiringMembers(expiringData);

            if (isAdmin) {
                const unverifiedData = await dashboardService.getUnverifiedMembers();
                setUnverifiedMembers(unverifiedData);

                // Fetch analytics data for admin
                setAnalyticsLoading(true);
                const analytics = await dashboardService.getAnalytics();
                setAnalyticsData(analytics);
                setAnalyticsLoading(false);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleVerify = async (id: string) => {
        try {
            await memberService.verify(id);
            // Refresh data
            fetchDashboardData();
        } catch (err) {
            console.error('Error verifying member:', err);
            alert('Failed to verify member');
        }
    };

    // Mobile Card Components
    const VerificationCard = ({ member }: { member: Member }) => (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{member.fullName}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{member.memberId || 'New'}</span>
                </div>
                <span className={`badge badge-${member.lastAction === 'CREATE' ? 'primary' : 'warning'}`}>
                    {member.lastAction === 'CREATE' ? 'NEW' : 'EDIT'}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <div>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                    <div className="text-success" style={{ fontWeight: 600 }}>{formatCurrency(member.amountPaid)}</div>
                </div>
                <div>
                    <span style={{ color: 'var(--text-muted)' }}>Added By:</span>
                    <div>
                        <span className={`badge badge-${member.createdBy?.role === 'ADMIN' ? 'success' : 'secondary'}`} style={{ fontSize: '0.7rem' }}>
                            {member.createdBy?.name || 'Unknown'}
                        </span>
                    </div>
                </div>
            </div>

            <button
                className="btn btn-sm btn-success"
                style={{ width: '100%' }}
                onClick={() => handleVerify(member._id)}
            >
                Approve & Verify
            </button>
        </div>
    );

    const RecentAdmissionCard = ({ member }: { member: Member }) => (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div>
                    <div className="member-name">{member.fullName}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>Joined: {new Date(member.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-success" style={{ fontWeight: 600 }}>{formatCurrency(member.amountPaid)}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-secondary">{PACKAGE_LABELS[member.packageType]}</span>
                {member.isVerified ? (
                    <span className="badge badge-success">✓ Verified</span>
                ) : (
                    <button className="btn btn-sm btn-success" onClick={() => handleVerify(member._id)}>
                        Approve
                    </button>
                )}
            </div>
        </div>
    );

    const ExpiringCard = ({ member }: { member: Member }) => {
        const daysLeft = getDaysUntilExpiry(member.packageEnd);
        return (
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div className="member-avatar" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                        {member.fullName.charAt(0)}
                    </div>
                    <div>
                        <div className="member-name">{member.fullName}</div>
                        <div className="member-phone">{member.phone}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Package</span>
                        <span style={{ fontSize: '0.85rem' }}>{PACKAGE_LABELS[member.packageType]}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</span>
                        {getStatusBadge('', daysLeft)}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in">
            <div className="page-header" style={{ flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
                <h1 className="page-title">Dashboard</h1>
                <div style={{ display: 'flex', gap: '0.5rem', width: isMobile ? '100%' : 'auto' }}>
                    <button className="btn btn-secondary" onClick={fetchDashboardData}>
                        <RefreshCw size={18} />
                    </button>
                    <LinkButton to="/members/new" style={{ flex: isMobile ? '1' : 'initial' }}>
                        <Plus size={18} />
                        Add Member
                    </LinkButton>
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <RefreshCw size={32} />
                    <p>Loading dashboard...</p>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="stats-grid">
                        <StatCard
                            label="Total Members"
                            value={stats.totalMembers}
                            icon={Users}
                            variant="primary"
                        />
                        <StatCard
                            label="Active Members"
                            value={stats.activeMembers}
                            icon={TrendingUp}
                            variant="success"
                        />
                        <StatCard
                            label="Expiring This Week"
                            value={stats.expiringThisWeek}
                            icon={AlertTriangle}
                            variant="warning"
                        />
                        <StatCard
                            label="Expired"
                            value={stats.expiredMembers}
                            icon={XCircle}
                            variant="danger"
                        />
                    </div>

                    {/* Analytics Charts - Admin Only */}
                    {isAdmin && (
                        <div style={{ overflowX: 'hidden' }}>
                            <AnalyticsCharts data={analyticsData} loading={analyticsLoading} />
                        </div>
                    )}

                    {/* Monthly Statistics - Admin Only */}
                    {isAdmin && (
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                color: 'var(--text-primary)',
                                fontSize: '1.1rem'
                            }}>
                                <Calendar size={20} />
                                This Month's Activity
                            </h3>
                            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                                <StatCard
                                    label="New Members This Month"
                                    value={stats.newMembersThisMonth || 0}
                                    icon={UserPlus}
                                    variant="primary"
                                />
                                <StatCard
                                    label="Renewed This Month"
                                    value={stats.renewedMembersThisMonth || 0}
                                    icon={RotateCcw}
                                    variant="success"
                                />
                            </div>
                        </div>
                    )}

                    {/* Pending Verification - Admin Only */}
                    {isAdmin && (stats?.unverifiedMembersCount || 0) > 0 && (
                        <Card
                            title="🚨 Verification Queue (Needs Approval)"
                            subtitle="All new admissions and edits by staff must be verified"
                            style={{ border: '2px solid var(--danger)', marginBottom: '2rem' }}
                        >
                            {isMobile ? (
                                <div className="mobile-list">
                                    {unverifiedMembers?.map(member => (
                                        <VerificationCard key={member._id} member={member} />
                                    ))}
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Member</th>
                                                <th>Amount Details</th>
                                                <th>Added By</th>
                                                <th>Action Type</th>
                                                <th>Approval</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unverifiedMembers?.map((member) => (
                                                <tr key={member._id}>
                                                    <td>
                                                        <b>{member.fullName}</b>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{member.memberId || 'New'}</div>
                                                    </td>
                                                    <td>
                                                        <div className="text-success" style={{ fontWeight: 600 }}>
                                                            Paid: {formatCurrency(member.amountPaid)}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            Price: {formatCurrency(member.packagePrice)} | Disc: {formatCurrency(member.discountAmount)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-${member.createdBy?.role === 'ADMIN' ? 'success' : 'secondary'}`}>
                                                            {member.createdBy?.name || 'Unknown'}
                                                        </span>
                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            {member.createdBy?.role || 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`badge badge-${member.lastAction === 'CREATE' ? 'primary' : 'warning'}`}>
                                                            {member.lastAction === 'CREATE' ? 'NEW ADMISSION' : 'EDITED'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleVerify(member._id)}
                                                        >
                                                            Approve & Verify
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Payment Stats - Admin Only */}
                    {isAdmin && (
                        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                            <StatCard
                                label="Total Collected"
                                value={formatCurrency(stats.totalCollected)}
                                icon={IndianRupee}
                                variant="success"
                            />
                            <StatCard
                                label="Pending Dues"
                                value={formatCurrency(stats.totalPending)}
                                icon={AlertCircle}
                                variant="warning"
                            />
                            <StatCard
                                label="Members with Dues"
                                value={stats.membersWithDues}
                                icon={Users}
                                variant="danger"
                            />
                        </div>
                    )}

                    {/* Content Grid */}
                    <div className="content-grid">
                        {/* Recent Admissions (3 Days) - Admin Only */}
                        {isAdmin && (
                            <Card
                                title="Recent Admissions (Past 3 Days)"
                                subtitle="Overview of all transactions from the last 72 hours"
                            >
                                {(stats?.recentAdmissions?.length || 0) === 0 ? (
                                    <div className="empty-state" style={{ padding: '2rem' }}>
                                        <Users size={32} />
                                        <p>No new admissions in the last 3 days</p>
                                    </div>
                                ) : (
                                    isMobile ? (
                                        <div className="mobile-list">
                                            {stats.recentAdmissions.map(member => (
                                                <RecentAdmissionCard key={member._id} member={member} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="table-container">
                                            <table className="table">
                                                <thead>
                                                    <tr>
                                                        <th>Member</th>
                                                        <th>Added By</th>
                                                        <th>Package</th>
                                                        <th>Collected</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stats.recentAdmissions.map((member) => (
                                                        <tr key={member._id}>
                                                            <td>
                                                                <div className="member-name">{member.fullName}</div>
                                                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Joined: {new Date(member.createdAt).toLocaleDateString()}</div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge badge-${member.createdBy?.role === 'ADMIN' ? 'success' : 'secondary'}`}>
                                                                    {member.createdBy?.name || 'Unknown'}
                                                                </span>
                                                            </td>
                                                            <td>{PACKAGE_LABELS[member.packageType]}</td>
                                                            <td className="text-success" style={{ fontWeight: 600 }}>{formatCurrency(member.amountPaid)}</td>
                                                            <td>
                                                                {member.isVerified ? (
                                                                    <span className="badge badge-success">✓ Verified</span>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-sm btn-success"
                                                                        onClick={() => handleVerify(member._id)}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                )}
                            </Card>
                        )}

                        {/* Expiring Soon */}
                        <Card
                            title="Expiring Soon"
                            action={<LinkButton to="/members?status=expiring" variant="secondary" size="sm">View All</LinkButton>}
                        >
                            {expiringMembers.length === 0 ? (
                                <div className="empty-state" style={{ padding: '2rem' }}>
                                    <Bell size={32} />
                                    <p>No members expiring this week</p>
                                </div>
                            ) : (
                                isMobile ? (
                                    <div className="mobile-list">
                                        {expiringMembers.slice(0, 5).map(member => (
                                            <ExpiringCard key={member._id} member={member} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="table-container">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Member</th>
                                                    <th>Package</th>
                                                    <th>Balance</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {expiringMembers.slice(0, 5).map((member) => {
                                                    const daysLeft = getDaysUntilExpiry(member.packageEnd);
                                                    return (
                                                        <tr key={member._id}>
                                                            <td>
                                                                <div className="member-info">
                                                                    <div className="member-avatar">
                                                                        {member.fullName.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <div className="member-name">{member.fullName}</div>
                                                                        <div className="member-phone">{member.phone}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>{PACKAGE_LABELS[member.packageType]}</td>
                                                            <td>
                                                                {(member.balanceDue || 0) > 0 ? (
                                                                    <span className="text-danger">{formatCurrency(member.balanceDue || 0)}</span>
                                                                ) : (
                                                                    <span className="text-success">Paid</span>
                                                                )}
                                                            </td>
                                                            <td>{getStatusBadge('', daysLeft)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            )}
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
