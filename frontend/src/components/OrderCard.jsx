import React from 'react';

const OrderCard = ({ order }) => {
    // Map backend states to readable UI text and CSS classes
    const getStatusDetails = (status) => {
        const statuses = {
            'RECEIVED': { text: 'Order Received', className: 'status-gray' },
            'PAYMENT_PENDING': { text: 'Processing Payment', className: 'status-orange' },
            'PAYMENT_FAILED': { text: 'Payment Failed', className: 'status-red' },
            'INVENTORY_PENDING': { text: 'Checking Inventory', className: 'status-blue' },
            'INVENTORY_FAILED': { text: 'Inventory Error', className: 'status-red' },
            'COMPLETED': { text: 'Order Completed', className: 'status-green' }
        };

        return statuses[status] || { text: status, className: 'status-gray' };
    };

    const statusDetails = getStatusDetails(order.status);

    return (
        <div className="order-card">
            <div className="order-header">
                <span className="order-id">ID: {order.id.slice(0, 8)}...</span>
                <span className={`status-badge ${statusDetails.className}`}>
                    {statusDetails.text}
                </span>
            </div>

            <div className="order-body">
                <div className="order-info">
                    <span className="label">Product:</span>
                    <span className="value">{order.product_id}</span>
                </div>
                <div className="order-info">
                    <span className="label">Quantity:</span>
                    <span className="value">{order.quantity} units</span>
                </div>
            </div>
        </div>
    );
};

export default OrderCard;
