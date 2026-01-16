import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, Edit, Trash2, Eye, Phone, Mail, IndianRupee,
    RefreshCw, CreditCard, Filter, ArrowUpDown, Users, Activity,
    AlertTriangle, TrendingUp, X, Calendar
} from 'lucide-react';
import { LinkButton, Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { memberService, paymentService } from '../services/api';
import type { Member, PackageType } from '../types';
import { PACKAGE_LABELS, PACKAGE_PRICES, PACKAGE_MONTHS } from '../types';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getDaysUntilExpiry(endDate: string): number {
    if (!endDate) return 0;
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getMemberStatus(member: Member) {
    const daysLeft = getDaysUntilExpiry(member.packageEnd);
    if (daysLeft <= 0) return { label: 'Expired', variant: 'danger' as const, days: daysLeft };
    if (daysLeft <= 7) return { label: 'Expiring', variant: 'warning' as const, days: daysLeft };
    return { label: 'Active', variant: 'success' as const, days: daysLeft };
}

function getPaymentStatus(balanceDue: number) {
    if (balanceDue > 0) return { label: 'Due', variant: 'danger' as const };
    return { label: 'Paid', variant: 'success' as const };
}

// ============================================================
// MEMBER CARD COMPONENT (Mobile/Tablet View)
// ============================================================

interface MemberCardProps {
    member: Member;
    onDelete: (id: string, name: string) => void;
    onPay: (member: Member) => void;
    onRenew: (member: Member) => void;
}

function MemberCard({ member, onDelete, onPay, onRenew }: MemberCardProps) {
    const status = getMemberStatus(member);
    const balance = member.balanceDue || 0;

    return (
        <div className="member-card">
            {/* Header */}
            <div className="member-card-header">
                <div className="member-card-avatar">
                    {member.fullName?.charAt(0) || '?'}
                </div>
                <div className="member-card-info">
                    <div className="member-card-name">{member.fullName || 'Unknown'}</div>
                    <span className="member-card-id">ID: {member.memberId || 'N/A'}</span>
                    <div className="member-card-contact">
                        <span><Phone size={12} /> {member.phone || 'N/A'}</span>
                        {member.email && <span><Mail size={12} /> {member.email}</span>}
                    </div>
                </div>
            </div>

            {/* Body Stats */}
            <div className="member-card-body">
                <div className="member-card-stat">
                    <div className="member-card-stat-label">Package</div>
                    <div className="member-card-stat-value">
                        {PACKAGE_LABELS[member.packageType]?.split(' ')[0] || member.packageType}
                    </div>
                </div>
                <div className="member-card-stat">
                    <div className="member-card-stat-label">Balance</div>
                    <div className={`member-card-stat-value ${balance > 0 ? 'danger' : 'success'}`}>
                        ₹{balance.toLocaleString()}
                    </div>
                </div>
                <div className="member-card-stat">
                    <div className="member-card-stat-label">Days Left</div>
                    <div className={`member-card-stat-value ${status.variant}`}>
                        {status.days > 0 ? status.days : 0}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="member-card-footer">
                <div className="member-card-status">
                    <Badge variant={status.variant}>{status.label}</Badge>
                    {status.days <= 0 && (
                        <span className="text-xs text-danger">{Math.abs(status.days)} days ago</span>
                    )}
                </div>
                <div className="member-card-actions">
                    {(status.variant === 'danger' || status.variant === 'warning') && (
                        <button className="btn btn-icon text-primary" title="Renew" onClick={() => onRenew(member)}>
                            <RefreshCw size={16} />
                        </button>
                    )}
                    <Link to={`/members/${member._id}`} className="btn btn-icon" title="View">
                        <Eye size={16} />
                    </Link>
                    <Link to={`/members/${member._id}/edit`} className="btn btn-icon" title="Edit">
                        <Edit size={16} />
                    </Link>
                    {balance > 0 && (
                        <button className="btn btn-icon text-gold" title="Pay" onClick={() => onPay(member)}>
                            <CreditCard size={16} />
                        </button>
                    )}
                    <button className="btn btn-icon text-danger" title="Delete" onClick={() => onDelete(member._id, member.fullName)}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function LoadingSkeleton({ isMobile }: { isMobile: boolean }) {
    if (isMobile) {
        return (
            <div className="member-cards-grid">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="skeleton skeleton-card" />
                ))}
            </div>
        );
    }
    return (
        <div>
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton skeleton-row" />
            ))}
        </div>
    );
}

// ============================================================
// MAIN MEMBERS COMPONENT
// ============================================================

export function Members() {
    // Data State
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'dues'>('all');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Responsive State
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // Payment Modal State
    const [paymentModal, setPaymentModal] = useState<{ show: boolean; member: Member | null }>({ show: false, member: null });
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [submittingPayment, setSubmittingPayment] = useState(false);

    // Renewal Modal State
    const [renewalModal, setRenewalModal] = useState<{ show: boolean; member: Member | null }>({ show: false, member: null });
    const [renewalPackage, setRenewalPackage] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
    const [renewalAmount, setRenewalAmount] = useState('');
    const [submittingRenewal, setSubmittingRenewal] = useState(false);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch Data
    const fetchMembers = async () => {
        try {
            setLoading(true);
            const data = await memberService.getAll();
            setMembers(data || []);
        } catch (err) {
            console.error('Error fetching members:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    // Stats
    const stats = useMemo(() => {
        const total = members.length;
        const active = members.filter(m => getDaysUntilExpiry(m.packageEnd) > 0).length;
        const expiring = members.filter(m => {
            const d = getDaysUntilExpiry(m.packageEnd);
            return d > 0 && d <= 7;
        }).length;
        const totalDues = members.reduce((sum, m) => sum + (m.balanceDue || 0), 0);
        return { total, active, expiring, totalDues };
    }, [members]);

    // Filtering & Sorting
    const filteredAndSortedMembers = useMemo(() => {
        let result = members.filter((member) => {
            const searchLower = searchTerm.toLowerCase();
            const fullName = member.fullName?.toLowerCase() || '';
            const phone = member.phone || '';
            const memberId = member.memberId?.toLowerCase() || '';
            const email = member.email?.toLowerCase() || '';

            const matchesSearch =
                fullName.includes(searchLower) ||
                phone.includes(searchTerm) ||
                memberId.includes(searchLower) ||
                email.includes(searchLower);

            const daysLeft = getDaysUntilExpiry(member.packageEnd);
            let matchesStatus = true;
            if (statusFilter === 'active') matchesStatus = daysLeft > 0;
            if (statusFilter === 'expiring') matchesStatus = daysLeft > 0 && daysLeft <= 7;
            if (statusFilter === 'expired') matchesStatus = daysLeft <= 0;
            if (statusFilter === 'dues') matchesStatus = (member.balanceDue || 0) > 0;

            return matchesSearch && matchesStatus;
        });

        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Member];
                let bValue: any = b[sortConfig.key as keyof Member];

                if (sortConfig.key === 'daysLeft') {
                    aValue = getDaysUntilExpiry(a.packageEnd);
                    bValue = getDaysUntilExpiry(b.packageEnd);
                }

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = (bValue || '').toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [members, searchTerm, statusFilter, sortConfig]);

    // Handlers
    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Delete Modal State
    const [deleteModal, setDeleteModal] = useState<{ show: boolean; memberId: string | null; memberName: string }>({ show: false, memberId: null, memberName: '' });
    const [isDeleting, setIsDeleting] = useState(false);

    const openDeleteModal = (id: string, memberName: string) => {
        setDeleteModal({ show: true, memberId: id, memberName });
    };

    const handleDeleteSubmit = async () => {
        if (!deleteModal.memberId) return;

        setIsDeleting(true);
        try {
            await memberService.delete(deleteModal.memberId);
            setDeleteModal({ show: false, memberId: null, memberName: '' });
            await fetchMembers();
        } catch (err: any) {
            console.error('Error deleting member:', err);
            const msg = err.response?.data?.message || err.message || 'Unknown error';
            alert(`Failed to delete member: ${msg}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const openPaymentModal = (member: Member) => {
        setPaymentModal({ show: true, member });
        setPaymentAmount('');
        setPaymentMethod('CASH');
        setPaymentNotes('');
    };

    const handlePaymentSubmit = async () => {
        if (!paymentModal.member || !paymentAmount) return;

        setSubmittingPayment(true);
        try {
            await paymentService.create({
                memberId: paymentModal.member._id,
                amount: Number(paymentAmount),
                method: paymentMethod,
                notes: paymentNotes || 'Additional payment',
                date: new Date().toISOString()
            });
            setPaymentModal({ show: false, member: null });
            await fetchMembers();
        } catch (err) {
            console.error('Error recording payment:', err);
            alert('Failed to record payment');
        } finally {
            setSubmittingPayment(false);
        }
    };

    const openRenewalModal = (member: Member) => {
        setRenewalModal({ show: true, member });
        const pkg = (Object.keys(PACKAGE_PRICES).includes(member.packageType) ? member.packageType : 'A') as PackageType;
        setRenewalPackage(pkg);
        setRenewalAmount(String(PACKAGE_PRICES[pkg]));
    };

    const handleRenewSubmit = async () => {
        if (!renewalModal.member) return;

        setSubmittingRenewal(true);
        try {
            await memberService.renew(renewalModal.member._id, {
                packageType: renewalPackage,
                packagePrice: PACKAGE_PRICES[renewalPackage],
                amountPaid: Number(renewalAmount) || 0
            });
            setRenewalModal({ show: false, member: null });
            await fetchMembers();
        } catch (err: any) {
            console.error('Error renewing membership:', err);
            const msg = err.response?.data?.message || err.message || 'Unknown error';
            alert(`Failed to renew: ${msg}`);
        } finally {
            setSubmittingRenewal(false);
        }
    };

    // ========================================
    // RENDER
    // ========================================

    return (
        <div className="animate-in space-y-6">
            {/* ===== HEADER ===== */}
            <div className="page-header">
                <h1 className="page-title">
                    <Users size={28} /> Members
                </h1>
                <div className="flex gap-2">
                    <button
                        className="btn btn-secondary"
                        onClick={fetchMembers}
                        disabled={loading}
                        title="Refresh"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <LinkButton to="/members/new">
                        <Plus size={18} /> Add Member
                    </LinkButton>
                </div>
            </div>

            {/* ===== STATS GRID ===== */}
            <div className="stats-grid">
                <div className="stat-card card">
                    <div>
                        <div className="value">{stats.total}</div>
                        <div className="label">Total Members</div>
                    </div>
                    <div className="icon primary"><Users size={24} /></div>
                </div>
                <div className="stat-card card">
                    <div>
                        <div className="value">{stats.active}</div>
                        <div className="label">Active</div>
                    </div>
                    <div className="icon success"><Activity size={24} /></div>
                </div>
                <div className="stat-card card">
                    <div>
                        <div className="value">{stats.expiring}</div>
                        <div className="label">Expiring Soon</div>
                    </div>
                    <div className="icon warning"><AlertTriangle size={24} /></div>
                </div>
                <div className="stat-card card">
                    <div>
                        <div className="value">₹{stats.totalDues.toLocaleString()}</div>
                        <div className="label">Total Dues</div>
                    </div>
                    <div className="icon danger"><TrendingUp size={24} /></div>
                </div>
            </div>

            {/* ===== MAIN CARD ===== */}
            <div className="card glass-card">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    {/* Search */}
                    <div className="search-input-wrapper">
                        <Search />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search members..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Filters */}
                    <div className="filter-group">
                        <span className="flex items-center gap-1 text-muted text-sm hide-mobile">
                            <Filter size={14} /> Filter:
                        </span>
                        {(['all', 'active', 'expiring', 'expired', 'dues'] as const).map((filter) => (
                            <button
                                key={filter}
                                className={`filter-btn ${statusFilter === filter ? 'active' : ''}`}
                                onClick={() => setStatusFilter(filter)}
                            >
                                {filter === 'dues' ? 'Dues' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <LoadingSkeleton isMobile={isMobile} />
                ) : (
                    <>
                        {/* ===== MOBILE/TABLET: Card Grid ===== */}
                        {isMobile ? (
                            <div className="member-cards-grid">
                                {filteredAndSortedMembers.map(member => (
                                    <MemberCard
                                        key={member._id}
                                        member={member}
                                        onDelete={openDeleteModal}
                                        onPay={openPaymentModal}
                                        onRenew={openRenewalModal}
                                    />
                                ))}
                                {filteredAndSortedMembers.length === 0 && (
                                    <div className="empty-state py-12" style={{ gridColumn: '1 / -1' }}>
                                        <Search size={48} className="text-muted opacity-50 mb-4" />
                                        <h3>No Members Found</h3>
                                        <p className="text-muted">Try adjusting your search or filters</p>
                                        <button className="btn-link mt-2" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                                            Clear Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ===== DESKTOP: Table ===== */
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort('fullName')} className="cursor-pointer transition-colors hover:text-gold">
                                                <div className="flex items-center gap-1">Member <ArrowUpDown size={12} /></div>
                                            </th>
                                            <th>Contact</th>
                                            <th>Package</th>
                                            <th onClick={() => handleSort('amountPaid')} className="cursor-pointer transition-colors hover:text-gold">
                                                <div className="flex items-center gap-1">Paid <ArrowUpDown size={12} /></div>
                                            </th>
                                            <th onClick={() => handleSort('balanceDue')} className="cursor-pointer transition-colors hover:text-gold">
                                                <div className="flex items-center gap-1">Balance <ArrowUpDown size={12} /></div>
                                            </th>
                                            <th onClick={() => handleSort('daysLeft')} className="cursor-pointer transition-colors hover:text-gold">
                                                <div className="flex items-center gap-1">Status <ArrowUpDown size={12} /></div>
                                            </th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSortedMembers.map((member) => {
                                            const status = getMemberStatus(member);
                                            const payment = getPaymentStatus(member.balanceDue || 0);
                                            const balance = member.balanceDue || 0;

                                            return (
                                                <tr key={member._id}>
                                                    <td>
                                                        <div className="member-info">
                                                            <div className="member-avatar">
                                                                {member.fullName?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <div className="member-name">{member.fullName || 'Unknown'}</div>
                                                                <div className="flex flex-col gap-1 mt-1">
                                                                    <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                                                                        {member.memberId || 'N/A'}
                                                                    </span>
                                                                    <span className="text-muted text-xs flex items-center gap-1">
                                                                        <Calendar size={10} /> {new Date(member.dateOfJoining).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="flex items-center gap-2 text-sm">
                                                                <Phone size={14} className="text-muted" /> {member.phone || 'N/A'}
                                                            </span>
                                                            {member.email && (
                                                                <span className="flex items-center gap-2 text-xs text-muted">
                                                                    <Mail size={12} /> {member.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="font-medium">{PACKAGE_LABELS[member.packageType] || member.packageType}</div>
                                                        <div className="text-xs text-muted">₹{(member.packagePrice || 0).toLocaleString()}</div>
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className="text-success font-medium">₹{(member.amountPaid || 0).toLocaleString()}</span>
                                                            <Badge variant={payment.variant}>{payment.label}</Badge>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {balance > 0 ? (
                                                            <div className="flex flex-col gap-2 items-start">
                                                                <span className="flex items-center gap-1 text-danger font-bold">
                                                                    <IndianRupee size={12} /> {balance.toLocaleString()}
                                                                </span>
                                                                <button
                                                                    className="btn btn-sm btn-primary btn-shimmer"
                                                                    onClick={() => openPaymentModal(member)}
                                                                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                                                >
                                                                    <CreditCard size={12} /> Pay Now
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-success font-medium">✓ Cleared</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="flex flex-col gap-1">
                                                            <Badge variant={status.variant} className={status.variant === 'danger' ? 'badge-pulse' : ''}>
                                                                {status.label}
                                                            </Badge>
                                                            <span className={`text-xs ${status.days > 0 ? 'text-muted' : 'text-danger'}`}>
                                                                {status.days > 0 ? `${status.days}d left` : `${Math.abs(status.days)}d ago`}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="flex gap-1">
                                                            {(status.variant === 'danger' || status.variant === 'warning') && (
                                                                <button
                                                                    className="btn btn-icon text-primary"
                                                                    title="Renew Membership"
                                                                    onClick={() => openRenewalModal(member)}
                                                                >
                                                                    <RefreshCw size={16} />
                                                                </button>
                                                            )}
                                                            <Link to={`/members/${member._id}`} className="btn btn-icon" title="View">
                                                                <Eye size={16} />
                                                            </Link>
                                                            <Link to={`/members/${member._id}/edit`} className="btn btn-icon" title="Edit">
                                                                <Edit size={16} />
                                                            </Link>
                                                            <button
                                                                className="btn btn-icon"
                                                                title="Delete"
                                                                onClick={() => openDeleteModal(member._id, member.fullName)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {filteredAndSortedMembers.length === 0 && (
                                            <tr>
                                                <td colSpan={7} className="empty-state py-12">
                                                    <Search size={48} className="text-muted opacity-50 mb-4" />
                                                    <h3>No Members Found</h3>
                                                    <p className="text-muted">Try adjusting your search or filters</p>
                                                    <button className="btn-link mt-2" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                                                        Clear Filters
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===== PAYMENT MODAL ===== */}
            {paymentModal.show && paymentModal.member && (
                <div className="modal-overlay" onClick={() => setPaymentModal({ show: false, member: null })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>💳 Record Payment</h2>
                            <button onClick={() => setPaymentModal({ show: false, member: null })}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            {/* Member Info Card */}
                            <div className="glass-card p-4 rounded-lg border border-border">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="member-card-avatar" style={{ width: 48, height: 48, fontSize: '1rem' }}>
                                        {paymentModal.member.fullName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{paymentModal.member.fullName}</h3>
                                        <span className="text-muted text-sm">{paymentModal.member.memberId}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-card-hover rounded-lg">
                                    <span className="text-muted">Outstanding Balance</span>
                                    <span className="text-danger font-bold text-xl">
                                        ₹{paymentModal.member.balanceDue.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="form-group">
                                <label className="form-label">Payment Amount *</label>
                                <div className="relative">
                                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
                                    <input
                                        type="number"
                                        className="form-input pl-10"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0.00"
                                        max={paymentModal.member.balanceDue}
                                        autoFocus
                                        style={{ fontSize: '1.25rem', fontWeight: 600 }}
                                    />
                                </div>
                                <div className="flex gap-2 mt-2">
                                    {[500, 1000, 2000].map(amount => (
                                        <button
                                            key={amount}
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => setPaymentAmount(String(Math.min(amount, paymentModal.member!.balanceDue)))}
                                        >
                                            +₹{amount}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setPaymentAmount(String(paymentModal.member!.balanceDue))}
                                    >
                                        Full
                                    </button>
                                </div>
                            </div>

                            {/* Method Select */}
                            <div className="form-group">
                                <label className="form-label">Payment Method *</label>
                                <div className="flex gap-2">
                                    {(['CASH', 'UPI', 'CARD'] as const).map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            className={`btn flex-1 ${paymentMethod === method ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setPaymentMethod(method)}
                                        >
                                            {method === 'CASH' && '💵'} {method === 'UPI' && '📱'} {method === 'CARD' && '💳'} {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group">
                                <label className="form-label">Notes (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={paymentNotes}
                                    onChange={(e) => setPaymentNotes(e.target.value)}
                                    placeholder="Transaction ID, reference, etc."
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <Button variant="secondary" onClick={() => setPaymentModal({ show: false, member: null })}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handlePaymentSubmit}
                                disabled={submittingPayment || !paymentAmount || Number(paymentAmount) <= 0}
                                className="btn-shimmer"
                            >
                                {submittingPayment ? <RefreshCw className="animate-spin" size={16} /> : <CreditCard size={16} />}
                                Confirm ₹{paymentAmount || '0'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== RENEWAL MODAL ===== */}
            {renewalModal.show && renewalModal.member && (
                <div className="modal-overlay" onClick={() => setRenewalModal({ show: false, member: null })}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>↻ Renew Membership</h2>
                            <button onClick={() => setRenewalModal({ show: false, member: null })}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body space-y-4">
                            {/* Member Info */}
                            <div className="glass-card p-4 rounded-lg border border-border">
                                <h3 className="font-bold text-lg">{renewalModal.member.fullName}</h3>
                                <p className="text-muted text-sm">Renewing from: {PACKAGE_LABELS[renewalModal.member.packageType]}</p>
                            </div>

                            {/* Package Selection */}
                            <div className="form-group">
                                <label className="form-label">Select Package *</label>
                                <select
                                    className="form-select"
                                    value={renewalPackage}
                                    onChange={(e) => setRenewalPackage(e.target.value as PackageType)}
                                >
                                    {Object.entries(PACKAGE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label} - ₹{PACKAGE_PRICES[value as PackageType].toLocaleString()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Package Price</label>
                                    <input
                                        type="text"
                                        className="form-input bg-card"
                                        value={`₹${(PACKAGE_PRICES[renewalPackage] || 0).toLocaleString()}`}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount Paid Now *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={renewalAmount}
                                        onChange={(e) => setRenewalAmount(e.target.value)}
                                        max={PACKAGE_PRICES[renewalPackage] || 0}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-card-hover rounded-lg text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-muted">New Expiry Date:</span>
                                    <span className="font-semibold text-primary">
                                        {(() => {
                                            const d = new Date();
                                            const months = PACKAGE_MONTHS[renewalPackage] || 1;
                                            d.setMonth(d.getMonth() + months);
                                            return d.toLocaleDateString();
                                        })()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Balance Due:</span>
                                    <span className="font-semibold text-danger">
                                        ₹{Math.max(0, (PACKAGE_PRICES[renewalPackage] || 0) - (Number(renewalAmount) || 0)).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <Button variant="secondary" onClick={() => setRenewalModal({ show: false, member: null })}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleRenewSubmit}
                                disabled={submittingRenewal}
                                className="btn-shimmer"
                            >
                                {submittingRenewal ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                                Confirm Renewal
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {deleteModal.show && (
                <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, memberId: null, memberName: '' })}>
                    <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="text-danger flex items-center gap-2">
                                <AlertTriangle size={24} /> Delete Member
                            </h2>
                            <button onClick={() => setDeleteModal({ show: false, memberId: null, memberName: '' })}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete <strong>{deleteModal.memberName}</strong>?</p>
                            <p className="text-muted text-sm mt-2">
                                This action cannot be undone. All payment history for this member will also be removed.
                            </p>
                        </div>
                        <div className="modal-footer">
                            <Button variant="secondary" onClick={() => setDeleteModal({ show: false, memberId: null, memberName: '' })}>
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteSubmit}
                                disabled={isDeleting}
                                className="btn-shimmer"
                            >
                                {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                                Delete Permanently
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
