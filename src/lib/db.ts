import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ?? 'localhost',
  port: parseInt(process.env.MYSQL_PORT ?? '3306', 10),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'build_dashboard',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function migrate(): Promise<void> {
  const connection = await pool.getConnection()
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        description VARCHAR(2000) NOT NULL DEFAULT '',
        repo_url VARCHAR(500) NOT NULL UNIQUE,
        branch VARCHAR(255) NOT NULL,
        stage VARCHAR(50) NOT NULL DEFAULT 'pending',
        status_json JSON DEFAULT NULL,
        percentage INT DEFAULT 0,
        current_task INT DEFAULT 0,
        total_tasks INT DEFAULT 0,
        error_count INT DEFAULT 0,
        last_polled_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS poll_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        success TINYINT(1) NOT NULL,
        error_message TEXT DEFAULT NULL,
        polled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `)
  } finally {
    connection.release()
  }
}
