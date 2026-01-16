import { useState, useEffect } from 'react';
import { CreditCard, TrendingUp, Calendar, IndianRupee, RefreshCw, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { paymentService, memberService } from '../services/api';
import type { Payment, Member } from '../types';

export function Payments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [paymentsData, membersData] = await Promise.all([
                paymentService.getAll(),
                memberService.getAll()
            ]);
            setPayments(paymentsData);
            setMembers(membersData);
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getMemberName = (memberId: string | any) => {
        if (typeof memberId === 'object' && memberId !== null) {
            return memberId.fullName || 'Unknown';
        }
        const member = members.find(m => m._id === memberId);
        return member?.fullName || 'Unknown';
    };

    // Calculate earnings by period
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const filterByDate = (start: Date, end?: Date) => {
        return payments.filter(p => {
            const date = new Date(p.date);
            return date >= start && (!end || date <= end);
        });
    };

    const todayPayments = filterByDate(startOfToday);
    const weekPayments = filterByDate(startOfWeek);
    const monthPayments = filterByDate(startOfMonth);
    const lastMonthPayments = filterByDate(startOfLastMonth, endOfLastMonth);

    const todayEarnings = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    const weekEarnings = weekPayments.reduce((sum, p) => sum + p.amount, 0);
    const monthEarnings = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const lastMonthEarnings = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate growth percentage
    const monthGrowth = lastMonthEarnings > 0
        ? ((monthEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1)
        : 0;

    // Payment method breakdown
    const methodBreakdown = payments.reduce((acc, p) => {
        acc[p.method] = (acc[p.method] || 0) + p.amount;
        return acc;
    }, {} as Record<string, number>);

    // Get filtered payments for display
    const getFilteredPayments = () => {
        switch (selectedPeriod) {
            case 'today': return todayPayments;
            case 'week': return weekPayments;
            case 'month': return monthPayments;
            default: return payments;
        }
    };

    const displayPayments = getFilteredPayments().sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Pagination Logic
    const totalPages = Math.ceil(displayPayments.length / ITEMS_PER_PAGE);
    const paginatedPayments = displayPayments.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedPeriod]);

    const getMethodBadge = (method: string) => {
        const colors: Record<string, 'primary' | 'success' | 'warning'> = {
            UPI: 'primary',
            CASH: 'success',
            CARD: 'warning',
        };
        return <Badge variant={colors[method] || 'primary'}>{method}</Badge>;
    };

    // Monthly breakdown for last 6 months
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthName = monthStart.toLocaleString('default', { month: 'short' });
        const monthTotal = filterByDate(monthStart, monthEnd).reduce((sum, p) => sum + p.amount, 0);
        monthlyBreakdown.push({ month: monthName, amount: monthTotal });
    }
    const maxMonthly = Math.max(...monthlyBreakdown.map(m => m.amount), 1);

    // Mobile Transaction Card
    const TransactionCard = ({ payment }: { payment: Payment }) => (
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="member-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                        {getMemberName(payment.memberId).charAt(0)}
                    </div>
                    <div>
                        <div className="member-name" style={{ fontSize: '0.9rem' }}>{getMemberName(payment.memberId)}</div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {new Date(payment.date).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '1rem' }}>+₹{payment.amount.toLocaleString()}</div>
                    {getMethodBadge(payment.method)}
                </div>
            </div>
            {payment.notes && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-input)', padding: '0.5rem', borderRadius: '4px' }}>
                    {payment.notes}
                </div>
            )}
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header">
                <h1 className="page-title">
                    <IndianRupee style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} size={28} />
                    Earnings & Payments
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
                        <p>Loading earnings data...</p>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Earnings Stats */}
                    <div className="stats-grid">
                        <StatCard
                            label="Today's Earnings"
                            value={`₹${todayEarnings.toLocaleString()}`}
                            icon={Calendar}
                            variant="primary"
                        />
                        <StatCard
                            label="This Week"
                            value={`₹${weekEarnings.toLocaleString()}`}
                            icon={TrendingUp}
                            variant="success"
                        />
                        <StatCard
                            label="This Month"
                            value={`₹${monthEarnings.toLocaleString()}`}
                            icon={IndianRupee}
                            variant="warning"
                        />
                        <StatCard
                            label="Total Lifetime"
                            value={`₹${totalEarnings.toLocaleString()}`}
                            icon={CreditCard}
                            variant="primary"
                        />
                    </div>

                    {/* Monthly Growth & Method Breakdown */}
                    <div className="content-grid" style={{ marginTop: '1.5rem', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)' }}>
                        {/* Monthly Trend */}
                        <Card title="Monthly Earnings Trend">
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', height: '150px', padding: '1rem 0', overflowX: 'auto' }}>
                                {monthlyBreakdown.map((item, idx) => (
                                    <div key={idx} style={{ flex: 1, minWidth: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <div
                                            style={{
                                                width: '100%',
                                                height: `${(item.amount / maxMonthly) * 100}%`,
                                                minHeight: '4px',
                                                background: idx === 5 ? 'var(--primary)' : 'var(--bg-card-hover)',
                                                borderRadius: '4px 4px 0 0',
                                                transition: 'height 0.3s ease'
                                            }}
                                        />
                                        <span className="text-muted" style={{ fontSize: '0.7rem' }}>{item.month}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                                            ₹{(item.amount / 1000).toFixed(1)}k
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: 'var(--bg-card-hover)',
                                borderRadius: '8px'
                            }}>
                                {Number(monthGrowth) >= 0 ? (
                                    <ArrowUp size={18} color="var(--secondary)" />
                                ) : (
                                    <ArrowDown size={18} color="var(--danger)" />
                                )}
                                <span style={{
                                    color: Number(monthGrowth) >= 0 ? 'var(--secondary)' : 'var(--danger)',
                                    fontWeight: 600
                                }}>
                                    {monthGrowth}%
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.8rem' }}>vs last month</span>
                            </div>
                        </Card>

                        {/* Payment Methods */}
                        <Card title="Payment Methods">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {Object.entries(methodBreakdown).length === 0 ? (
                                    <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No payments yet
                                    </div>
                                ) : (
                                    Object.entries(methodBreakdown).map(([method, amount]) => {
                                        const percentage = totalEarnings > 0 ? (amount / totalEarnings * 100).toFixed(0) : 0;
                                        return (
                                            <div key={method}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {method === 'CASH' && '💵'}
                                                        {method === 'UPI' && '📱'}
                                                        {method === 'CARD' && '💳'}
                                                        {method}
                                                    </span>
                                                    <span style={{ fontWeight: 600 }}>₹{amount.toLocaleString()}</span>
                                                </div>
                                                <div style={{
                                                    width: '100%',
                                                    height: '8px',
                                                    background: 'var(--bg-card-hover)',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${percentage}%`,
                                                        height: '100%',
                                                        background: method === 'CASH' ? 'var(--secondary)' : method === 'UPI' ? 'var(--primary)' : 'var(--warning)',
                                                        borderRadius: '4px'
                                                    }} />
                                                </div>
                                                <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                                    {percentage}% of total
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Recent Transactions */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <Card title="Recent Transactions">
                            {/* Period Filter */}
                            <div className="filter-group" style={{ marginBottom: '1rem', overflowX: 'auto', display: 'flex' }}>
                                {[
                                    { key: 'today', label: 'Today' },
                                    { key: 'week', label: 'This Week' },
                                    { key: 'month', label: 'This Month' },
                                    { key: 'all', label: 'All Time' },
                                ].map(period => (
                                    <button
                                        key={period.key}
                                        className={`filter-btn ${selectedPeriod === period.key ? 'active' : ''}`}
                                        onClick={() => setSelectedPeriod(period.key as any)}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {period.label}
                                    </button>
                                ))}
                            </div>

                            {displayPayments.length === 0 ? (
                                <div className="empty-state" style={{ padding: '2rem' }}>
                                    <CreditCard size={48} />
                                    <h3>No Transactions</h3>
                                    <p className="text-muted">No payments recorded for this period</p>
                                </div>
                            ) : (
                                isMobile ? (
                                    <div className="mobile-list">
                                        {paginatedPayments.map(payment => (
                                            <TransactionCard key={payment._id} payment={payment} />
                                        ))}
                                    </div>
                                ) : (
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
                                                {paginatedPayments.map((payment) => (
                                                    <tr key={payment._id}>
                                                        <td>
                                                            <div className="member-info">
                                                                <div className="member-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                                                                    {getMemberName(payment.memberId).charAt(0)}
                                                                </div>
                                                                <div className="member-name" style={{ fontSize: '0.9rem' }}>
                                                                    {getMemberName(payment.memberId)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <strong style={{ color: 'var(--secondary)', fontSize: '1rem' }}>
                                                                +₹{payment.amount.toLocaleString()}
                                                            </strong>
                                                        </td>
                                                        <td className="text-secondary" style={{ fontSize: '0.85rem' }}>
                                                            {new Date(payment.date).toLocaleDateString('en-IN', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td>{getMethodBadge(payment.method)}</td>
                                                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>{payment.notes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                                                <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, displayPayments.length)} of {displayPayments.length}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <Button
                                                        variant="secondary"
                                                        disabled={currentPage === 1}
                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                        style={{ padding: '0.25rem 0.5rem', height: 'auto' }}
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </Button>
                                                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.9rem' }}>
                                                        Page {currentPage} of {totalPages}
                                                    </span>
                                                    <Button
                                                        variant="secondary"
                                                        disabled={currentPage === totalPages}
                                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                        style={{ padding: '0.25rem 0.5rem', height: 'auto' }}
                                                    >
                                                        <ChevronRight size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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
