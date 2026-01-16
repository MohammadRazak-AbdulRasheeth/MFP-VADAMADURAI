import type { CSSProperties } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface AnalyticsData {
    monthlyRevenue: { month: string; revenue: number; members: number }[];
    packageDistribution: { name: string; value: number; revenue: number }[];
    paymentStatus: { name: string; value: number }[];
}

interface AnalyticsChartsProps {
    data: AnalyticsData | null;
    loading: boolean;
}

const COLORS = ['#00C49F', '#FF8042', '#0088FE', '#FFBB28', '#8884d8'];
const PAYMENT_COLORS = { PAID: '#00C49F', DUE: '#FF8042' };

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

export function AnalyticsCharts({ data, loading }: AnalyticsChartsProps) {
    if (loading) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const tooltipStyle: CSSProperties = {
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow)'
    };

    return (
        <div className="analytics-section" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>📊 Analytics Overview</h2>

            <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {/* Package Distribution Chart */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>📦 Package Distribution</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data.packageDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={false}
                            >
                                {data.packageDistribution.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                // @ts-ignore
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: 'var(--text-primary)' }}
                                formatter={(value: number, name: string, props: any) => [
                                    `${value} members (${formatCurrency(props.payload.revenue)})`,
                                    props.payload.name
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Payment Status Chart */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>💳 Payment Status</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={data.paymentStatus}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.paymentStatus.map((entry) => (
                                    <Cell
                                        key={`cell-${entry.name}`}
                                        fill={PAYMENT_COLORS[entry.name as keyof typeof PAYMENT_COLORS] || '#8884d8'}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                // @ts-ignore
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Member Growth Chart */}
                <div className="card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-secondary)' }}>👥 New Members</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={data.monthlyRevenue}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} />
                            <Tooltip
                                // @ts-ignore
                                contentStyle={tooltipStyle}
                                itemStyle={{ color: 'var(--text-primary)' }}
                                cursor={{ fill: 'var(--bg-card-hover)' }}
                            />
                            <Bar dataKey="members" fill="#00C49F" radius={[4, 4, 0, 0]} name="New Members" maxBarSize={80} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
