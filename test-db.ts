import mysql from "mysql2/promise";

async function test() {
  try {
    const conn = await mysql.createConnection("mysql://2031667_evlte:Er1VtA1L0@mariadb-142.wc1.lan3.stabletransit.com:3306/2031667_evlte");
    console.log("Connected to MariaDB successfully");
    await conn.end();
  } catch (err) {
    console.error("Failed to connect to MariaDB:", err);
  }
}

test();
