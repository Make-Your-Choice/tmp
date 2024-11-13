var db = require("../db/db.js");

// Create a new order with multiple items
exports.createOrder = (req, res) => {
    const { user_id, items, order_status } = req.body;

    if (!user_id || !items || !order_status) {
        res.status(400).json({ "error": "Missing order details" });
        return;
    }

    // Validate the order_status to ensure it's a valid status
    const checkStatusSql = "SELECT * FROM order_status_type WHERE name = ?";
    db.get(checkStatusSql, [order_status], (err, statusRow) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!statusRow) {
            res.status(400).json({ "error": "Invalid order status" });
            return;
        }

        // Start a transaction to ensure atomicity
        db.serialize(() => {
            // Insert the order into the user_order table with the order_status_id
            const sql = `INSERT INTO user_order (user_id, order_status_id) VALUES (?, ?)`;
            db.run(sql, [user_id, statusRow.id], function (err) {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }

                const orderId = this.lastID;

                // Insert each item into the order_item table
                const itemSql = `INSERT INTO order_item (order_id, item_id, quantity) VALUES (?, ?, ?)`;
                const itemStmt = db.prepare(itemSql);

                // Insert each item and quantity into the order_item table
                items.forEach(item => {
                    itemStmt.run(orderId, item.item_id, item.quantity, (err) => {
                        if (err) {
                            res.status(400).json({ "error": err.message });
                            return;
                        }
                    });
                });

                itemStmt.finalize();

                // Return the created order with associated items
                res.json({
                    "message": "Order created successfully",
                    "order_id": orderId,
                    "user_id": user_id,
                    "items": items,
                    "order_status": order_status
                });
            });
        });
    });
};

// Get all orders with their statuses
exports.getAllOrders = (req, res) => {
    const sql = `
        SELECT u.id AS order_id, u.user_id, o.status_name AS order_status, u.order_date
        FROM user_order u
        JOIN order_status_type o ON u.order_status_id = o.id
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ "error": err.message });
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
};

// Get order by ID and include the associated items and status
exports.getOrderById = (req, res) => {
    const orderId = req.params.id;

    // Get order details including order status
    const sqlOrder = `
        SELECT u.id AS order_id, u.user_id, o.name AS order_status, u.order_date
        FROM user_order u
        JOIN order_status_type o ON u.order_status_id = o.id
        WHERE u.id = ?
    `;
    db.get(sqlOrder, [orderId], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        // Get items in this order
        const sqlItems = `
            SELECT item.id, item.name, item.price, oi.quantity
            FROM item
            JOIN order_item oi ON oi.item_id = item.id
            WHERE oi.order_id = ?
        `;
        db.all(sqlItems, [orderId], (err, items) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }

            res.json({
                "message": "success",
                "order": row,
                "items": items
            });
        });
    });
};

exports.updateOrderStatus = (req, res) => {
    const orderId = req.params.id;
    const { order_status } = req.body;

    if (!order_status) {
        res.status(400).json({ "error": "Order status is required" });
        return;
    }

    // Validate the order status
    const checkStatusSql = "SELECT * FROM order_status_type WHERE name = ?";
    db.get(checkStatusSql, [order_status], (err, statusRow) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!statusRow) {
            res.status(400).json({ "error": "Invalid order status" });
            return;
        }

        // Update the order status
        const sql = "UPDATE user_order SET order_status_id = ? WHERE id = ?";
        db.run(sql, [statusRow.id, orderId], function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ "message": "Order not found" });
                return;
            }

            res.json({
                "message": "Order updated successfully",
                "order_id": orderId,
                "order_status": order_status
            });
        });
    });
};

// Delete an order by ID
exports.deleteOrder = (req, res) => {
    const orderId = req.params.id;

    // Start a transaction to delete the order and associated items
    db.serialize(() => {
        // Delete items from order_item table
        const sqlItems = "DELETE FROM order_item WHERE order_id = ?";
        db.run(sqlItems, [orderId], (err) => {
            if (err) {
                return res.status(400).json({ "error": err.message });
            }

            // Now delete the order from user_order table
            const sqlOrder = "DELETE FROM user_order WHERE id = ?";
            db.run(sqlOrder, [orderId], function (err) {
                if (err) {
                    return res.status(400).json({ "error": err.message });
                }

                if (this.changes === 0) {
                    return res.status(404).json({ "message": "Order not found" });
                }

                res.json({
                    "message": "Order deleted successfully",
                    "order_id": orderId
                });
            });
        });
    });
};
