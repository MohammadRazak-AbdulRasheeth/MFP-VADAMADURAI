import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export function StatCard({ label, value, icon: Icon, variant = 'primary' }: StatCardProps) {
    return (
        <div className="card stat-card animate-in">
            <div>
                <div className="value">{value}</div>
                <div className="label">{label}</div>
            </div>
            <div className={`icon ${variant}`}>
                <Icon size={24} />
            </div>
        </div>
    );
}

interface CardProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function Card({ title, subtitle, children, action, className = '', style }: CardProps) {
    return (
        <div className={`card ${className}`} style={style}>
            {(title || action) && (
                <div className="flex items-center justify-between mb-4">
                    <div>
                        {title && <h3>{title}</h3>}
                        {subtitle && <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{subtitle}</p>}
                    </div>
                    {action}
                </div>
            )}
            {children}
        </div>
    );
}
