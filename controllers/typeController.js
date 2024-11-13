var db = require("../db/db");

exports.getAllTypes = (req, res) => {
    var sql = "SELECT * FROM type_item";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.json({ message: "success", data: rows });
    });
};

exports.getTypeById = (req, res) => {
    var sql = "SELECT * FROM type_item WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Type not found" });
        }
        res.json({ message: "success", data: row });
    });
};

exports.createType = (req, res) => {
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Name is required" });
    }

    var data = { name: name.trim() };

    var sql = "INSERT INTO type_item (name) VALUES (?)";
    db.run(sql, [data.name], function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        res.status(201).json({ message: "success", data: data, id: this.lastID });
    });
};

exports.updateType = (req, res) => {
    const { name } = req.body;

    // Validate input
    if (!name || name.trim() === "") {
        return res.status(400).json({ error: "Name is required" });
    }

    var data = { name: name.trim() };

    db.run(
        `UPDATE type_item SET 
           name = COALESCE(?,name)
           WHERE id = ?`,
        [data.name, req.params.id],
        function (err) {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: "Type not found" });
            }
            res.json({ message: "success", data: data, changes: this.changes });
        }
    );
};

exports.deleteType = (req, res) => {
    db.run("DELETE FROM type_item WHERE id = ?", req.params.id, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Type not found" });
        }
        res.json({ message: "deleted", changes: this.changes });
    });
};
