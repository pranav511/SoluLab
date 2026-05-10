const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "admin",
  database: "SoluLab",
});

module.exports = pool;