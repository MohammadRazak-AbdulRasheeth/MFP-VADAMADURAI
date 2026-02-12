
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { reportsService } from '../services/api';

export function Reports() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const reportData = await reportsService.getMonthlyGrowth();
            // Format months for display (e.g., "2025-01" -> "Jan 2025")
            const formattedData = reportData.map((item: any) => {
                const [year, month] = item.month.split('-');
                const date = new Date(parseInt(year), parseInt(month) - 1);
                return {
                    ...item,
                    displayMonth: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                };
            });
            setData(formattedData);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const exportToCSV = () => {
        if (!data.length) return;

        const headers = ['Month', 'New Members', 'Renewals'];
        const csvContent = [
            headers.join(','),
            ...data.map(row => `${row.month},${row.newMembers},${row.renewals}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'monthly_growth_report.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const ReportMobileCard = ({ row }: { row: any }) => (
        <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)',
            marginBottom: '1rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{row.displayMonth}</span>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Activity</span>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{row.newMembers + row.renewals}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>New Joinings</div>
                    <span className="badge badge-primary" style={{ fontSize: '1rem', padding: '0.25rem 0.75rem' }}>{row.newMembers}</span>
                </div>
                <div style={{ background: 'rgba(40, 167, 69, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(40, 167, 69, 0.1)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Renewals</div>
                    <span className="badge badge-success" style={{ fontSize: '1rem', padding: '0.25rem 0.75rem' }}>{row.renewals}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in">
            <div className="page-header" style={{
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center'
            }}>
                <h1 className="page-title">
                    <Calendar className="mr-2" /> Monthly Reports
                </h1>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    <button
                        className="btn btn-secondary"
                        onClick={fetchReports}
                        style={{ flex: isMobile ? '0 0 auto' : 'initial' }}
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={exportToCSV}
                        disabled={!data.length}
                        style={{ flex: isMobile ? 1 : 'initial' }}
                    >
                        <Download size={18} style={{ marginRight: '0.5rem' }} /> Export CSV
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <RefreshCw size={32} className="animate-spin" />
                    <p>Loading reports...</p>
                </div>
            ) : (
                <div className="content-grid" style={{ gridTemplateColumns: '1fr' }}>

                    {/* Chart Section */}
                    <Card title="Growth Trends: New vs Renewals">
                        <div style={{ width: '100%', height: isMobile ? 300 : 400 }}>
                            {data.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data}
                                        margin={{
                                            top: 20,
                                            right: 30,
                                            left: 20,
                                            bottom: 5,
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                                        <XAxis dataKey="displayMonth" stroke="#888" />
                                        <YAxis stroke="#888" />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend />
                                        <Bar dataKey="newMembers" name="New Joinings" fill="#d4af37" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="renewals" name="Renewals" fill="#28a745" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#666' }}>
                                    No chart data available
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Table/Card Section */}
                    <Card title="Detailed Breakdown">
                        {isMobile ? (
                            <div className="mobile-list">
                                {data.length === 0 ? (
                                    <div className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>No data available</div>
                                ) : (
                                    data.map((row) => (
                                        <ReportMobileCard key={row.month} row={row} />
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th className="text-right">New Joinings</th>
                                            <th className="text-right">Renewals</th>
                                            <th className="text-right">Total Activity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center" style={{ padding: '2rem' }}>No data available</td>
                                            </tr>
                                        ) : (
                                            data.map((row) => (
                                                <tr key={row.month}>
                                                    <td style={{ fontWeight: 600 }}>{row.displayMonth}</td>
                                                    <td className="text-right">
                                                        <span className="badge badge-primary">{row.newMembers}</span>
                                                    </td>
                                                    <td className="text-right">
                                                        <span className="badge badge-success">{row.renewals}</span>
                                                    </td>
                                                    <td className="text-right" style={{ fontWeight: 600 }}>
                                                        {row.newMembers + row.renewals}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
