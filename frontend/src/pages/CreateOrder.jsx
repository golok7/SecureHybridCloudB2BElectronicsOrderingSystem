import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const CreateOrder = () => {
    const [productId, setProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // In a real app, this might come from an API
    const availableProducts = [
        { id: 'ROUTER-01', name: 'Enterprise Router X1' },
        { id: 'SWITCH-48', name: '48-Port Gigabit Switch' },
        { id: 'SERVER-BLADE', name: 'Server Blade v2' },
        { id: 'FIREWALL-PRO', name: 'Hardware Firewall Pro' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!productId || quantity <= 0) {
            setError('Please select a valid product and quantity greater than 0');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.post('/create-order', { productId, quantity: Number(quantity) });
            // Redirect to orders page upon success
            navigate('/orders', { state: { message: 'Order created successfully!' } });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create order');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <header className="page-header">
                <h2>Create New Order</h2>
                <p>Submit a new hardware request to our distribution center</p>
            </header>

            <div className="form-container">
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="standard-form">
                    <div className="form-group">
                        <label>Select Product</label>
                        <select
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            required
                        >
                            <option value="" disabled>-- Choose a product --</option>
                            {availableProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.id})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max="1000"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate(-1)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting || !productId}
                        >
                            {isSubmitting ? 'Processing...' : 'Submit Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateOrder;
