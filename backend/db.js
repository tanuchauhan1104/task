const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'taskmanager.db');

let dbInstance = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    owner_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at DATETIME DEFAULT (datetime('now')),
    UNIQUE(project_id, user_id)
  );
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    project_id INTEGER NOT NULL,
    assignee_id INTEGER,
    created_by INTEGER NOT NULL,
    due_date DATE,
    created_at DATETIME DEFAULT (datetime('now')),
    updated_at DATETIME DEFAULT (datetime('now'))
  );
`;

function saveDb(SQL_db) {
  const data = SQL_db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

async function getDb() {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();
  let SQL_db;

  if (fs.existsSync(DB_PATH)) {
    SQL_db = new SQL.Database(fs.readFileSync(DB_PATH));
  } else {
    SQL_db = new SQL.Database();
  }

  SQL_db.exec(SCHEMA);
  saveDb(SQL_db);
  console.log('✅ DB initialized at', DB_PATH);

  dbInstance = {
    _db: SQL_db,
    _save() { saveDb(SQL_db); },

    all(sql, params = []) {
      try {
        const stmt = SQL_db.prepare(sql);
        stmt.bind(params);
        const rows = [];
        while (stmt.step()) rows.push(stmt.getAsObject());
        stmt.free();
        return rows;
      } catch(e) { throw new Error(e.message); }
    },

    get(sql, params = []) {
      return this.all(sql, params)[0] || null;
    },

    run(sql, params = []) {
      try {
        SQL_db.run(sql, params);
        const res = SQL_db.exec("SELECT last_insert_rowid() as id");
        const lastInsertRowid = res[0]?.values[0][0] || null;
        this._save();
        return { lastInsertRowid };
      } catch(e) { throw new Error(e.message); }
    },

    exec(sql) {
      SQL_db.exec(sql);
      this._save();
    }
  };

  return dbInstance;
}

function getDbSync() {
  if (!dbInstance) throw new Error('DB not initialized. Ensure server.js awaits getDb() first.');
  return dbInstance;
}

module.exports = { getDb, getDbSync };
