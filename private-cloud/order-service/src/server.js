require('dotenv').config();
const amqplib = require('amqplib');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

/* -------------------- ENV VALIDATION -------------------- */

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("FATAL ERROR: SUPABASE credentials missing.");
    process.exit(1);
}

if (!process.env.RABBITMQ_URL) {
    console.error("FATAL ERROR: RABBITMQ_URL missing.");
    process.exit(1);
}

if (!process.env.PAYMENT_SERVICE_URL || !process.env.INVENTORY_SERVICE_URL) {
    console.error("FATAL ERROR: Service URLs missing.");
    process.exit(1);
}

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL;
const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL;

const PRODUCT_PRICES = {
    "ROUTER-01": 100,
    "SWITCH-01": 150
};

/* -------------------- HELPERS -------------------- */

async function updateOrderStatus(orderId, status) {
    console.log(`Updating order ${orderId} → ${status}`);

    const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

    if (error) {
        throw new Error(error.message);
    }
}

/* -------------------- START CONSUMER -------------------- */

const start = async () => {
    try {
        const connection = await amqplib.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue('order_queue', { durable: true });

        console.log("Order Service waiting for messages...");

        channel.consume('order_queue', async (msg) => {
            if (!msg) return;

            const raw = JSON.parse(msg.content.toString());

            // 🔥 Normalize payload
            const order = {
                orderId: raw.orderId || raw.id,
                productId: raw.productId || raw.product_id,
                quantity: raw.quantity
            };

            console.log("Processing order:", order);

            try {
                const unitPrice = PRODUCT_PRICES[order.productId];

                if (!unitPrice) {
                    await updateOrderStatus(order.orderId, 'PAYMENT_FAILED');
                    channel.ack(msg);
                    return;
                }

                const totalAmount = unitPrice * order.quantity;

                /* ---------- PAYMENT ---------- */

                await updateOrderStatus(order.orderId, 'PAYMENT_PENDING');

                const paymentRes = await axios.post(
                    `${paymentServiceUrl}/internal/process-payment`,
                    {
                        orderId: order.orderId,
                        productId: order.productId,
                        quantity: order.quantity,
                        amount: totalAmount
                    }
                );

                if (!paymentRes.data.success) {
                    await updateOrderStatus(order.orderId, 'PAYMENT_FAILED');
                    channel.ack(msg);
                    return;
                }

                /* ---------- INVENTORY ---------- */

                await updateOrderStatus(order.orderId, 'INVENTORY_PENDING');

                const inventoryRes = await axios.post(
                    `${inventoryServiceUrl}/internal/reserve-stock`,
                    {
                        productId: order.productId,
                        quantity: order.quantity
                    }
                );

                if (!inventoryRes.data.success) {
                    await updateOrderStatus(order.orderId, 'INVENTORY_FAILED');
                    channel.ack(msg);
                    return;
                }

                /* ---------- SUCCESS ---------- */

                await updateOrderStatus(order.orderId, 'COMPLETED');
                channel.ack(msg);

            } catch (err) {
                console.error("System error:", err.message);
                channel.nack(msg, false, true);
            }
        });

    } catch (err) {
        console.error("Startup failed:", err.message);
        setTimeout(start, 5000);
    }
};

start();