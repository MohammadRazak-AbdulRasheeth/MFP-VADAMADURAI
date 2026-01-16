import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button, LinkButton } from '../components/ui/Button';
import { memberService } from '../services/api';
import type { PackageType } from '../types';
import { PACKAGE_LABELS, PACKAGE_MONTHS, PACKAGE_PRICES } from '../types';

export function MemberForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        dateOfJoining: new Date().toISOString().split('T')[0],
        packageType: 'A' as PackageType,
        packagePrice: PACKAGE_PRICES['A'],
        packageStart: new Date().toISOString().split('T')[0],
        amountPaid: '',
        trainerId: '',
        discountType: 'NONE' as 'NONE' | 'FIXED' | 'CUSTOM',
        discountAmount: '0',
        paymentMethod: 'CASH',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load member data if editing
    useEffect(() => {
        if (id && id !== 'new') {
            setLoading(true);
            memberService.getById(id)
                .then(member => {
                    setFormData({
                        fullName: member.fullName,
                        phone: member.phone,
                        whatsapp: member.whatsapp || '',
                        email: member.email || '',
                        address: member.address || '',
                        dateOfJoining: member.dateOfJoining.split('T')[0],
                        packageType: member.packageType,
                        packagePrice: member.packagePrice,
                        packageStart: member.packageStart.split('T')[0],
                        amountPaid: member.amountPaid.toString(),
                        trainerId: member.trainerId || '',
                        discountType: (member as any).discountType || 'NONE',
                        discountAmount: ((member as any).discountAmount || 0).toString(),
                    });
                })
                .catch(err => {
                    console.error('Error loading member:', err);
                    setError('Failed to load member');
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    // Update package price and discount when package type or discount type changes
    useEffect(() => {
        if (!isEditing) {
            setFormData(prev => ({
                ...prev,
                packagePrice: PACKAGE_PRICES[prev.packageType],
                discountAmount: prev.discountType === 'FIXED' ? '500' : (prev.discountType === 'NONE' ? '0' : prev.discountAmount)
            }));
        } else {
            // Even when editing, if user flips discount type to FIXED or NONE, we might want to auto-update
            setFormData(prev => ({
                ...prev,
                discountAmount: prev.discountType === 'FIXED' ? '500' : (prev.discountType === 'NONE' ? '0' : prev.discountAmount)
            }));
        }
    }, [formData.packageType, formData.discountType, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateEndDate = () => {
        const start = new Date(formData.packageStart);
        const months = PACKAGE_MONTHS[formData.packageType];
        const end = new Date(start);
        end.setMonth(end.getMonth() + months);
        return end.toISOString().split('T')[0];
    };

    const packagePrice = Number(formData.packagePrice) || 0;
    const discountAmount = Number(formData.discountAmount) || 0;
    const finalPrice = Math.max(0, packagePrice - discountAmount);
    const numAmountPaid = parseFloat(formData.amountPaid) || 0;
    const amountPaid = parseFloat(formData.amountPaid) || 0;
    const balanceDue = Math.max(0, finalPrice - amountPaid);
    const paymentStatus = balanceDue === 0 ? 'PAID' : 'DUE';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const memberData = {
                fullName: formData.fullName,
                phone: formData.phone,
                whatsapp: formData.whatsapp || undefined,
                email: formData.email || undefined,
                address: formData.address || undefined,
                dateOfJoining: formData.dateOfJoining,
                packageType: formData.packageType,
                packagePrice: packagePrice,
                packageStart: formData.packageStart,
                packageEnd: calculateEndDate(),
                amountPaid: amountPaid,
                trainerId: formData.trainerId || undefined,
                discountType: formData.discountType,
                discountType: formData.discountType,
                discountAmount: discountAmount,
                paymentMethod: formData.paymentMethod,
            };

            if (isEditing && id) {
                await memberService.update(id, memberData);
            } else {
                await memberService.create(memberData);
            }

            navigate('/members');
        } catch (err: any) {
            console.error('Error saving member:', err);
            setError(err.response?.data?.message || 'Error saving member');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-in">
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    Loading member data...
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <div className="flex items-center gap-4">
                    <LinkButton to="/members" variant="secondary">
                        <ArrowLeft size={18} />
                    </LinkButton>
                    <h1 className="page-title">{isEditing ? 'Edit Member' : 'Add New Member'}</h1>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '800px' }}>
                {error && (
                    <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Personal Information */}
                    <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Personal Information</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Full Name *</label>
                            <input
                                type="text"
                                name="fullName"
                                className="form-input"
                                placeholder="Enter full name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                className="form-input"
                                placeholder="9876543210"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">WhatsApp Number</label>
                            <input
                                type="tel"
                                name="whatsapp"
                                className="form-input"
                                placeholder="9876543210"
                                value={formData.whatsapp}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                placeholder="member@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Address</label>
                        <textarea
                            name="address"
                            className="form-input"
                            placeholder="Enter address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={2}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    {/* Membership Details */}
                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Membership Details</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Date of Joining * (Lifetime)</label>
                            <input
                                type="date"
                                name="dateOfJoining"
                                className="form-input"
                                value={formData.dateOfJoining}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => ({
                                        ...prev,
                                        dateOfJoining: val,
                                        // Auto-sync package start for new members
                                        packageStart: !isEditing ? val : prev.packageStart
                                    }));
                                }}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Package Type *</label>
                            <select
                                name="packageType"
                                className="form-select"
                                value={formData.packageType}
                                onChange={handleChange}
                                required
                            >
                                {Object.entries(PACKAGE_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>{label} - ₹{PACKAGE_PRICES[value as PackageType].toLocaleString()}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Package Start Date * (Current Plan)</label>
                            <input
                                type="date"
                                name="packageStart"
                                className="form-input"
                                value={formData.packageStart}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Package End Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={calculateEndDate()}
                                disabled
                                style={{ opacity: 0.7 }}
                            />
                        </div>
                    </div>

                    {/* Discount Details */}
                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Discount & Special Offers</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Discount Type</label>
                            <select
                                name="discountType"
                                className="form-select"
                                value={formData.discountType}
                                onChange={handleChange}
                            >
                                <option value="NONE">None</option>
                                <option value="FIXED">Fixed (₹500)</option>
                                <option value="CUSTOM">Custom Amount</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Discount Amount (₹)</label>
                            <input
                                type="number"
                                name="discountAmount"
                                className="form-input"
                                value={formData.discountAmount}
                                onChange={handleChange}
                                disabled={formData.discountType !== 'CUSTOM'}
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Payment Details */}
                    <h4 style={{ marginTop: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Payment Details</h4>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Package Price (₹)</label>
                            <input
                                type="number"
                                name="packagePrice"
                                className="form-input"
                                value={formData.packagePrice}
                                readOnly
                                style={{ background: 'var(--bg-card)', opacity: 0.8, cursor: 'not-allowed' }}
                                required
                            />
                            <small style={{ color: 'var(--text-muted)' }}>Fixed based on package selection</small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Amount Paid (₹) *</label>
                            <input
                                type="number"
                                name="amountPaid"
                                className="form-input"
                                placeholder="0"
                                value={formData.amountPaid}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const numVal = parseFloat(val) || 0;
                                    if (numVal > finalPrice) {
                                        setError(`Amount paid (₹${numVal}) cannot exceed final price (₹${finalPrice})`);
                                    } else {
                                        setError('');
                                    }
                                    setFormData(prev => ({ ...prev, amountPaid: val }));
                                }}
                                required
                            />
                            {numAmountPaid > finalPrice && (
                                <small style={{ color: 'var(--danger)' }}>Error: Exceeds final price</small>
                            )}
                        </div>
                        <div className="form-group">
                            <label className="form-label">Payment Method</label>
                            <select
                                name="paymentMethod"
                                className="form-select"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                            >
                                <option value="CASH">CASH 💵</option>
                                <option value="UPI">UPI 📱</option>
                                <option value="CARD">CARD 💳</option>
                            </select>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div style={{
                        background: 'var(--bg-card-hover)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginTop: '1rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '1rem'
                    }}>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Price</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>₹{packagePrice.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Discount</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--danger)' }}>-₹{discountAmount.toLocaleString()}</div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Amount Paid</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--secondary)' }}>
                                ₹{amountPaid.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>Balance Due</div>
                            <div style={{
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                color: balanceDue > 0 ? 'var(--danger)' : 'var(--secondary)'
                            }}>
                                ₹{balanceDue.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Payment Status Indicator */}
                    <div style={{ marginTop: '1rem' }}>
                        <span
                            className={`badge badge-${paymentStatus === 'PAID' ? 'success' : 'danger'}`}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                        >
                            {paymentStatus === 'PAID' ? '✓ PAID' : '✗ DUE'}
                        </span>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-4" style={{ marginTop: '2rem' }}>
                        <Button type="submit" disabled={isSubmitting}>
                            <Save size={18} />
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Member' : 'Add Member')}
                        </Button>
                        <LinkButton to="/members" variant="secondary">
                            Cancel
                        </LinkButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
