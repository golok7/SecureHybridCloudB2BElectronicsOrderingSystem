import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const Dashboard = () => {
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/orders');
                const orders = res.data;

                // Calculate stats from orders array
                const calculatedStats = {
                    total: orders.length,
                    completed: orders.filter(o => o.status === 'COMPLETED').length,
                    pending: orders.filter(o => o.status.includes('PENDING') || o.status === 'RECEIVED').length,
                    failed: orders.filter(o => o.status.includes('FAILED')).length
                };

                setStats(calculatedStats);
            } catch (error) {
                console.error('Failed to fetch orders for dashboard stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="loading-spinner">Loading dashboard data...</div>;

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Overview Dashboard</h2>
                <p>Monitor your company's order activity</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Orders</h3>
                    <p className="stat-value">{stats.total}</p>
                </div>
                <div className="stat-card success">
                    <h3>Completed</h3>
                    <p className="stat-value">{stats.completed}</p>
                </div>
                <div className="stat-card warning">
                    <h3>In Progress</h3>
                    <p className="stat-value">{stats.pending}</p>
                </div>
                <div className="stat-card danger">
                    <h3>Failed</h3>
                    <p className="stat-value">{stats.failed}</p>
                </div>
            </div>

            <div className="dashboard-actions">
                <Link to="/create-order" className="btn-primary">
                    + Create New Order
                </Link>
                <Link to="/orders" className="btn-secondary">
                    View All Orders
                </Link>
            </div>
        </div>
    );
};

export default Dashboard;
