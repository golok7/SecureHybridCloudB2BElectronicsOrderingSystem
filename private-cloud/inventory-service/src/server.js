require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

if (!process.env.PORT) {
    console.error("PORT missing.");
    process.exit(1);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error("Supabase credentials missing.");
    process.exit(1);
}

const port = process.env.PORT;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

app.post('/internal/reserve-stock', async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        console.log(`Reserve request: ${productId} x ${quantity}`);

        const { data: inventory, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('product_id', productId)
            .single();

        if (error || !inventory) {
            return res.json({ success: false });
        }

        if (inventory.stock < quantity) {
            return res.json({ success: false });
        }

        const { error: updateError } = await supabase
            .from('inventory')
            .update({ stock: inventory.stock - quantity })
            .eq('product_id', productId);

        if (updateError) {
            throw new Error(updateError.message);
        }

        return res.json({ success: true });

    } catch (err) {
        console.error("Inventory error:", err.message);
        return res.status(500).json({ success: false });
    }
});

app.listen(port, () => {
    console.log(`Inventory Service listening on port ${port}`);
});