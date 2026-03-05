import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import OrderCard from '../components/OrderCard';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const location = useLocation();

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            // Sort to show newest first if we assume later in array means newer, 
            // or just reverse the array if IDs increment
            setOrders(res.data.reverse());
            setError('');
        } catch (err) {
            setError('Failed to fetch orders. Please try again later.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchOrders();

        // Standard polling implementation (Every 5 seconds)
        const intervalId = setInterval(() => {
            fetchOrders();
        }, 5000);

        // Cleanup interval on component unmount
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Order Tracking</h2>
                <p>Real-time status updates for all your orders</p>
            </header>

            {/* Display success message if redirected from create order */}
            {location.state?.message && (
                <div className="success-message success-toast">
                    {location.state.message}
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="orders-list">
                {loading ? (
                    <div className="loading-spinner">Loading orders...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-state">
                        <p>You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="orders-grid">
                        {orders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
