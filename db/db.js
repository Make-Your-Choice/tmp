var sqlite3 = require('sqlite3').verbose();
var bcrypt = require('bcrypt');
const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        
        // Enable foreign key constraints
        db.run("PRAGMA foreign_keys = ON", (err) => {
            if (err) {
                console.error("Failed to enable foreign keys:", err.message);
            }
        });

        // Create user table
        db.run(`create table if not exists user (
            id integer primary key autoincrement,
            name text, 
            email text unique, 
            password text
        )`, (err) => {
            if (err) {
                console.error("Error creating user table", err.message);
                return;
            }

            // Insert default users if the table was successfully created
            insertDefaultUsers();
        });

        // Create type_item table (item types)
        db.run(`create table if not exists type_item (
            id integer primary key autoincrement,
            name text
        )`, (err) => {
            if (err) {
                console.error("Error creating type_item table", err.message);
            }
        });

        // Create item table (items linked with types)
        db.run(`create table if not exists item (
            id integer primary key autoincrement,
            name text, 
            description text,
            price integer, 
            photo blob, 
            type_id integer,
            foreign key (type_id) references type_item (id)
        )`, (err) => {
            if (err) {
                console.error("Error creating item table", err.message);
            }
        });

        // Create order_status_type table (order statuses)
        db.run(`create table if not exists order_status_type (
            id integer primary key autoincrement,
            name text
        )`, (err) => {
            if (err) {
                console.error("Error creating order_status_type table", err.message);
            } else {
                // Insert default order statuses if they do not exist
                insertDefaultOrderStatuses();
            }
        });

        // Create user_order table (orders with user and order status)
        db.run(`create table if not exists user_order (
            id integer primary key autoincrement,
            user_id integer, 
            order_status_id integer,
            order_date timestamp default current_timestamp, 
            foreign key (user_id) references user (id),
            foreign key (order_status_id) references order_status_type (id)
        )`, (err) => {
            if (err) {
                console.error("Error creating user_order table", err.message);
            }
        });

        // Create order_item table (many-to-many relationship between orders and items)
        db.run(`create table if not exists order_item (
            order_id integer,
            item_id integer,
            quantity integer,
            primary key (order_id, item_id),
            foreign key (order_id) references user_order(id),
            foreign key (item_id) references item(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating order_item table", err.message);
            } else {
                console.log("order_item table created successfully");
            }
        });
    }
});

// Helper function to insert default users
async function insertDefaultUsers() {
    try {
        const insert = 'insert into user (name, email, password) values (?,?,?)';

        // Hash passwords using bcrypt before inserting
        const adminPassword = await bcrypt.hash("admin123456", 10);
        const userPassword = await bcrypt.hash("user123456", 10);

        db.run(insert, ["admin", "admin@example.com", adminPassword], function(err) {
            if (err) {
                console.error("Error inserting admin user", err.message);
            } else {
                console.log("Admin user inserted with ID:", this.lastID);
            }
        });

        db.run(insert, ["user", "user@example.com", userPassword], function(err) {
            if (err) {
                console.error("Error inserting user", err.message);
            } else {
                console.log("User inserted with ID:", this.lastID);
            }
        });
    } catch (err) {
        console.error("Error hashing passwords:", err.message);
    }
}

// Helper function to insert default order statuses
function insertDefaultOrderStatuses() {
    const statuses = ['pending', 'shipped', 'delivered'];

    statuses.forEach(status => {
        const checkStatusSql = "SELECT id FROM order_status_type WHERE name = ?";
        db.get(checkStatusSql, [status], (err, row) => {
            if (err) {
                console.error("Error checking order status", err.message);
            } else if (!row) {
                const insertStatusSql = "INSERT INTO order_status_type (name) VALUES (?)";
                db.run(insertStatusSql, [status], (err) => {
                    if (err) {
                        console.error("Error inserting order status", err.message);
                    } else {
                        console.log(`Order status '${status}' inserted`);
                    }
                });
            }
        });
    });
}

// Helper function to insert default item types
function insertDefaultItemTypes() {
    const types = ['Electronics', 'Clothing', 'Food'];

    types.forEach(type => {
        const checkTypeSql = "SELECT id FROM type_item WHERE name = ?";
        db.get(checkTypeSql, [type], (err, row) => {
            if (err) {
                console.error("Error checking item type", err.message);
            } else if (!row) {
                const insertTypeSql = "INSERT INTO type_item (name) VALUES (?)";
                db.run(insertTypeSql, [type], (err) => {
                    if (err) {
                        console.error("Error inserting item type", err.message);
                    } else {
                        console.log(`Item type '${type}' inserted`);
                    }
                });
            }
        });
    });
}

module.exports = db;
