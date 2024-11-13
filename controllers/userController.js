var db = require("../db/db");
var md5 = require("md5");

// Get all users
exports.getAllUsers = (req, res) => {
    var sql = "SELECT * FROM user";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
};

// Get a user by their ID
exports.getUserById = (req, res) => {
    var sql = "SELECT * FROM user WHERE id = ?";
    db.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ message: "success", data: row });
    });
};

// Create a new user
exports.createUser = (req, res) => {
    var errors = [];

    // Validation checks
    if (!req.body.password) errors.push("No password specified");
    if (!req.body.email) errors.push("No email specified");

    // Check if the email already exists in the database
    db.get("SELECT id FROM user WHERE email = ?", [req.body.email], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.status(400).json({ error: "Email already exists" });
            return;
        }

        // If there are validation errors, return them
        if (errors.length) {
            res.status(400).json({ error: errors.join(",") });
            return;
        }

        var data = {
            name: req.body.name,
            email: req.body.email,
            password: md5(req.body.password)
        };

        // Insert the new user into the database
        var sql = "INSERT INTO user (name, email, password) VALUES (?,?,?)";
        db.run(sql, [data.name, data.email, data.password], function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.status(201).json({ message: "success", data: data, id: this.lastID });
        });
    });
};

// Update a user by ID
exports.updateUser = (req, res) => {
    var data = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password ? md5(req.body.password) : null
    };

    // Check if email exists in the database, and validate that it's not being changed to an existing email
    db.get("SELECT id FROM user WHERE email = ? AND id != ?", [data.email, req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (row) {
            res.status(400).json({ error: "Email already exists" });
            return;
        }

        // Update the user in the database
        db.run(
            `UPDATE user SET 
               name = COALESCE(?, name), 
               email = COALESCE(?, email), 
               password = COALESCE(?, password) 
               WHERE id = ?`,
            [data.name, data.email, data.password, req.params.id],
            function (err) {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) {
                    res.status(404).json({ error: "User not found" });
                    return;
                }
                res.json({ message: "success", data: data, changes: this.changes });
            }
        );
    });
};

// Delete a user by ID
exports.deleteUser = (req, res) => {
    db.run("DELETE FROM user WHERE id = ?", req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
};
