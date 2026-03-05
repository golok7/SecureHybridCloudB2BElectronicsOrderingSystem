require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

if (!process.env.PORT) {
    console.error("PORT missing.");
    process.exit(1);
}

const port = process.env.PORT;

const PRODUCT_PRICES = {
    "ROUTER-01": 100,
    "SWITCH-01": 150
};

app.post('/internal/process-payment', async (req, res) => {
    try {
        const { productId, quantity, amount } = req.body;

        console.log("Payment request:", req.body);

        if (!PRODUCT_PRICES[productId]) {
            return res.json({ success: false });
        }

        const expectedAmount = PRODUCT_PRICES[productId] * quantity;

        if (amount !== expectedAmount) {
            console.log("Payment failed: incorrect amount");
            return res.json({ success: false });
        }

        console.log("Payment successful");

        return res.json({
            success: true,
            transactionId: `TXN-${Date.now()}`
        });

    } catch (err) {
        console.error("Payment error:", err.message);
        return res.status(500).json({ success: false });
    }
});

app.listen(port, () => {
    console.log(`Payment Service listening on port ${port}`);
});