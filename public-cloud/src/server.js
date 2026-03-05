require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const amqplib = require('amqplib');

const app = express();
app.use(express.json());
app.use(cors());

/* ==============================
   ENV VALIDATION
============================== */

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error("FATAL ERROR: JWT_SECRET is not defined.");
    process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
    console.error("FATAL ERROR: SUPABASE_URL and SUPABASE_SECRET_KEY must be defined.");
    process.exit(1);
}

if (!process.env.RABBITMQ_URL) {
    console.error("FATAL ERROR: RABBITMQ_URL is not defined.");
    process.exit(1);
}

/* ==============================
   SUPABASE
============================== */

const supabase = createClient(supabaseUrl, supabaseSecretKey);

/* ==============================
   RABBITMQ WITH RETRY
============================== */

let channel = null;

const connectRabbitMQ = async (retries = 10) => {
    const delay = 3000;

    for (let i = 0; i < retries; i++) {
        try {
            const connection = await amqplib.connect(process.env.RABBITMQ_URL);

            connection.on("error", err => {
                console.error("RabbitMQ connection error:", err.message);
            });

            connection.on("close", () => {
                console.error("RabbitMQ connection closed. Reconnecting...");
                connectRabbitMQ();
            });

            channel = await connection.createChannel();
            await channel.assertQueue('order_queue', { durable: true });

            console.log("✅ RabbitMQ Connected");
            return;

        } catch (error) {
            console.log(`⏳ RabbitMQ not ready. Retry ${i + 1}/${retries}`);
            await new Promise(res => setTimeout(res, delay));
        }
    }

    console.error("❌ Could not connect to RabbitMQ after retries.");
    process.exit(1);
};

/* ==============================
   AUTH MIDDLEWARE
============================== */

const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid Token" });
    }
};

/* ==============================
   ROUTES
============================== */

// Register
app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name)
        return res.status(400).json({ error: "Missing fields" });

    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
        .from('companies')
        .insert([{ email, password_hash, name }])
        .select();

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Registered", data });
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data)
        return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, data.password_hash);
    if (!match)
        return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
        { id: data.id, email: data.email },
        jwtSecret,
        { expiresIn: '1h', algorithm: 'HS256' }
    );

    res.json({
        token,
        user: {
            id: data.id,
            name: data.name,
            email: data.email
        }
    });
});

// Create Order
app.post('/create-order', authenticate, async (req, res) => {
    if (!channel)
        return res.status(503).json({ error: "Order service unavailable. Try again later." });

    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0)
        return res.status(400).json({ error: "Invalid order data" });

    const { data, error } = await supabase
        .from('orders')
        .insert([{
            company_id: req.user.id,
            product_id: productId,
            quantity,
            status: 'RECEIVED'
        }])
        .select();

    if (error)
        return res.status(400).json({ error: error.message });

    const order = data[0];

    channel.sendToQueue(
        'order_queue',
        Buffer.from(JSON.stringify({
            orderId: order.id,
            companyId: req.user.id,
            productId,
            quantity
        })),
        { persistent: true }
    );

    res.json({ message: "Order Received", order });
});

// Get All Orders
app.get('/orders', authenticate, async (req, res) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('company_id', req.user.id)
        .order('created_at', { ascending: false });

    if (error)
        return res.status(400).json({ error: error.message });

    res.json(data);
});

// Get Single Order
app.get('/order/:id', authenticate, async (req, res) => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', req.params.id)
        .eq('company_id', req.user.id)
        .single();

    if (error || !data)
        return res.status(404).json({ error: "Order not found" });

    res.json(data);
});

/* ==============================
   START SERVER AFTER MQ READY
============================== */

const port = process.env.PORT || 3000;

const startServer = async () => {
    await connectRabbitMQ();

    app.listen(port, () => {
        console.log(`🚀 Public Cloud listening on port ${port}`);
    });
};

startServer();