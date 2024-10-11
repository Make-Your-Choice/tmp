var sqlite3 = require('sqlite3').verbose()
var md5 = require('md5')

const DBSOURCE = "db.sqlite"

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run(`create table user (
            id integer primary key autoincrement,
            name text, 
            email text unique, 
            password text, 
            constraint email_unique unique (email)
            )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created, creating some rows
                var insert = 'insert into user (name, email, password) values (?,?,?)'
                db.run(insert, ["admin","admin@example.com",md5("admin123456")])
                db.run(insert, ["user","user@example.com",md5("user123456")])
            }
        });
        db.run(`create table type_item (
            id integer primary key autoincrement,
            name text
            )`,
        (err) => {
            // 
        });   
        db.run(`create table item (
            id integer primary key autoincrement,
            name text, 
            description text,
            price integer, 
            photo blob, 
            type_id integer,
            foreign key (type_id) references type_item (id)
            )`,
        (err) => {
            // 
        }); 
    }
});


module.exports = db
