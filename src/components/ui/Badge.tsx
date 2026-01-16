interface BadgeProps {
    variant: 'success' | 'warning' | 'danger' | 'primary';
    children: React.ReactNode;
    className?: string;
}

export function Badge({ variant, children, className = '' }: BadgeProps) {
    return (
        <span className={`badge badge-${variant} ${className}`}>
            {children}
        </span>
    );
}

export function getStatusBadge(status: string, daysUntilExpiry?: number) {
    if (status === 'EXPIRED' || (daysUntilExpiry !== undefined && daysUntilExpiry < 0)) {
        return <Badge variant="danger">Expired</Badge>;
    }
    if (daysUntilExpiry !== undefined && daysUntilExpiry <= 7) {
        return <Badge variant="warning">Expiring Soon</Badge>;
    }
    return <Badge variant="success">Active</Badge>;
}

export function getPaymentBadge(status: 'PAID' | 'DUE') {
    if (status === 'PAID') {
        return <Badge variant="success">Paid</Badge>;
    }
    return <Badge variant="danger">Due</Badge>;
}
