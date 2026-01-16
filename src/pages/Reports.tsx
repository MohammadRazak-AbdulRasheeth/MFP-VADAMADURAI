import { useState, useEffect } from 'react';
import { FileText, Download, RefreshCw, Users, IndianRupee, AlertTriangle, Calendar } from 'lucide-react';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { dashboardService, memberService, paymentService } from '../services/api';
import type { DashboardStats, Member, Payment } from '../types';
import { PACKAGE_LABELS } from '../types';

export function Reports() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<'summary' | 'members' | 'payments' | 'dues'>('summary');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsData, membersData, paymentsData] = await Promise.all([
                dashboardService.getStats(),
                memberService.getAll(),
                paymentService.getAll()
            ]);
            setStats(statsData);
            setMembers(membersData);
            setPayments(paymentsData);
        } catch (err) {
            console.error('Error fetching reports:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        const csv = [headers, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const exportMembers = () => {
        const data = members.map(m => ({
            Name: m.fullName,
            Phone: m.phone,
            Email: m.email || '',
            Package: PACKAGE_LABELS[m.packageType],
            PackagePrice: m.packagePrice,
            AmountPaid: m.amountPaid,
            BalanceDue: m.balanceDue,
            Status: m.paymentStatus,
            JoinDate: new Date(m.dateOfJoining).toLocaleDateString(),
            ExpiryDate: new Date(m.packageEnd).toLocaleDateString(),
        }));
        exportToCSV(data, 'members_report');
    };

    const exportPayments = () => {
        const data = payments.map(p => {
            const member = members.find(m => m._id === p.memberId);
            return {
                Member: member?.fullName || 'Unknown',
                Amount: p.amount,
                Date: new Date(p.date).toLocaleDateString(),
                Method: p.method,
                Notes: p.notes || '',
            };
        });
        exportToCSV(data, 'payments_report');
    };

    const exportDues = () => {
        const dueMembers = members.filter(m => (m.balanceDue || 0) > 0);
        const data = dueMembers.map(m => ({
            Name: m.fullName,
            Phone: m.phone,
            Package: PACKAGE_LABELS[m.packageType],
            PackagePrice: m.packagePrice,
            AmountPaid: m.amountPaid,
            BalanceDue: m.balanceDue,
        }));
        exportToCSV(data, 'pending_dues_report');
    };

    const membersWithDues = members.filter(m => (m.balanceDue || 0) > 0);
    const totalDues = membersWithDues.reduce((sum, m) => sum + (m.balanceDue || 0), 0);
    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">
                    <FileText style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={28} />
                    Reports
                </h1>
                <Button variant="secondary" onClick={fetchData}>
                    <RefreshCw size={18} />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <Card>
                    <div className="empty-state">
                        <RefreshCw size={32} />
                        <p>Loading reports...</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Report Type Tabs */}
                    <div className="filter-group" style={{ marginBottom: '1.5rem' }}>
                        {[
                            { key: 'summary', label: '📊 Summary' },
                            { key: 'members', label: '👥 Members' },
                            { key: 'payments', label: '💳 Payments' },
                            { key: 'dues', label: '⚠️ Pending Dues' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                className={`filter-btn ${reportType === tab.key ? 'active' : ''}`}
                                onClick={() => setReportType(tab.key as any)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Summary Report */}
                    {reportType === 'summary' && stats && (
                        <>
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
                                    icon={Users}
                                    variant="success"
                                />
                                <StatCard
                                    label="Total Collected"
                                    value={`₹${totalCollected.toLocaleString()}`}
                                    icon={IndianRupee}
                                    variant="success"
                                />
                                <StatCard
                                    label="Pending Dues"
                                    value={`₹${totalDues.toLocaleString()}`}
                                    icon={AlertTriangle}
                                    variant="warning"
                                />
                            </div>
                            <Card className="mt-4">
                                <h4>Quick Stats</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Expiring This Week</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.expiringThisWeek}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Expired Members</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{stats.expiredMembers}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Members with Dues</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{membersWithDues.length}</div>
                                    </div>
                                    <div style={{ padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '8px' }}>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Total Transactions</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{payments.length}</div>
                                    </div>
                                </div>
                            </Card>
                        </>
                    )}

                    {/* Members Report */}
                    {reportType === 'members' && (
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4>All Members ({members.length})</h4>
                                <Button onClick={exportMembers}>
                                    <Download size={18} />
                                    Export CSV
                                </Button>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>Package</th>
                                            <th>Paid</th>
                                            <th>Due</th>
                                            <th>Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map(m => (
                                            <tr key={m._id}>
                                                <td>{m.fullName}</td>
                                                <td>{m.phone}</td>
                                                <td>{PACKAGE_LABELS[m.packageType]}</td>
                                                <td className="text-success">₹{(m.amountPaid || 0).toLocaleString()}</td>
                                                <td className={(m.balanceDue || 0) > 0 ? 'text-danger' : 'text-success'}>
                                                    ₹{(m.balanceDue || 0).toLocaleString()}
                                                </td>
                                                <td>{new Date(m.packageEnd).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Payments Report */}
                    {reportType === 'payments' && (
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4>All Payments ({payments.length})</h4>
                                <Button onClick={exportPayments}>
                                    <Download size={18} />
                                    Export CSV
                                </Button>
                            </div>
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Member</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Method</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map(p => {
                                            const member = members.find(m => m._id === p.memberId);
                                            return (
                                                <tr key={p._id}>
                                                    <td>{member?.fullName || 'Unknown'}</td>
                                                    <td className="text-success">₹{p.amount.toLocaleString()}</td>
                                                    <td>{new Date(p.date).toLocaleDateString()}</td>
                                                    <td>{p.method}</td>
                                                    <td className="text-muted">{p.notes || '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Pending Dues Report */}
                    {reportType === 'dues' && (
                        <Card>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4>Members with Pending Dues ({membersWithDues.length})</h4>
                                <Button onClick={exportDues}>
                                    <Download size={18} />
                                    Export CSV
                                </Button>
                            </div>
                            {membersWithDues.length === 0 ? (
                                <div className="empty-state">
                                    <IndianRupee size={48} />
                                    <h3>No Pending Dues</h3>
                                    <p className="text-muted">All members have paid their full amount!</p>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Phone</th>
                                                <th>Package Price</th>
                                                <th>Paid</th>
                                                <th>Balance Due</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {membersWithDues.map(m => (
                                                <tr key={m._id}>
                                                    <td>{m.fullName}</td>
                                                    <td>{m.phone}</td>
                                                    <td>₹{(m.packagePrice || 0).toLocaleString()}</td>
                                                    <td className="text-success">₹{(m.amountPaid || 0).toLocaleString()}</td>
                                                    <td className="text-danger" style={{ fontWeight: 600 }}>
                                                        ₹{(m.balanceDue || 0).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
