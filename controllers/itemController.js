var db = require("../db/db");

// Get all items
exports.getAllItems = (req, res) => {
    var sql = "SELECT * FROM item";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
};

// Get an item by its ID
exports.getItemById = (req, res) => {
    var sql = "SELECT * FROM item WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "Item not found" });
            return;
        }
        res.json({ message: "success", data: row });
    });
};

// Create a new item
exports.createItem = (req, res) => {
    const { name, description, price, photo, type_id } = req.body;

    if (!name || !description || !price || !photo || !type_id) {
        res.status(400).json({ "error": "Missing item details" });
        return;
    }

    // Check if the type_id exists in type_item
    const checkTypeSql = "SELECT * FROM type_item WHERE id = ?";
    db.get(checkTypeSql, [type_id], (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            res.status(400).json({ "error": "Invalid type_id" });
            return;
        }

        const sql = "INSERT INTO item (name, description, price, photo, type_id) VALUES (?, ?, ?, ?, ?)";
        db.run(sql, [name, description, price, photo, type_id], function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({ "message": "Item created successfully", "id": this.lastID });
        });
    });
};


// Update an item by ID
exports.updateItem = (req, res) => {
    var data = {
        name: req.body.name,
        description: req.body.description || '',
        price: req.body.price,
        type_id: req.body.type_id,
        photo: req.body.photo || null
    };

    // Validate that type_id exists in the type_item table
    db.get("SELECT id FROM type_item WHERE id = ?", [data.type_id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(400).json({ error: "Invalid type_id specified" });
            return;
        }

        // Update the item in the database
        db.run(
            `UPDATE item SET 
               name = COALESCE(?, name), 
               description = COALESCE(?, description), 
               price = COALESCE(?, price),
               type_id = COALESCE(?, type_id),
               photo = COALESCE(?, photo) 
               WHERE id = ?`,
            [data.name, data.description, data.price, data.type_id, data.photo, req.params.id],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.json({ message: "success", data: data, changes: this.changes });
            }
        );
    });
};

// Delete an item by ID
exports.deleteItem = (req, res) => {
    db.run("DELETE FROM item WHERE id = ?", req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "Item not found" });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
};
