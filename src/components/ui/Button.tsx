import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'sm' | 'md';
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}: ButtonProps) {
    const classes = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`;

    return (
        <button className={classes} {...props}>
            {children}
        </button>
    );
}

interface LinkButtonProps {
    to: string;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md';
    children: ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function LinkButton({ to, variant = 'primary', size = 'md', children, className = '', style }: LinkButtonProps) {
    const classes = `btn btn-${variant} ${size === 'sm' ? 'btn-sm' : ''} ${className}`;

    return (
        <Link to={to} className={classes} style={style}>
            {children}
        </Link>
    );
}
