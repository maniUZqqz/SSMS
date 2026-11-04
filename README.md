# Web SQL Studio

A lightweight, browser-based alternative to SQL Server Management Studio (SSMS) for Windows.
A small local Node.js server does the database work; the UI opens in your browser and looks and
works much like SSMS, with Blue, Light and Dark themes.

## Features

- Object Explorer with filtering, row counts and Object Explorer Details (F7)
- Query editor with IntelliSense, multiple result sets, messages, execution plans and query history
- Edit table data (Edit Top 200 Rows) and design tables, including SSMS-style Column Properties
- Script objects as CREATE / ALTER / SELECT, export results
- Connects to SQL Server, MySQL, MariaDB, PostgreSQL, Oracle, SQLite, MongoDB, Redis and Cassandra
- Opens mold data files (`.cdb`) saved by injection-moulding machine controllers, read-only

## Run

Double-click **`start.bat`**. On a new computer it first gets what is missing:

- **Node.js 22.13+**: uses the installed Node.js when it is new enough. Otherwise it downloads a
  portable copy into `runtime\`, checked against the official SHA-256 list, with no admin rights needed.
- **npm packages**: installed into `node_modules\` when any is missing.

Then it opens <http://127.0.0.1:5050/>.

Without `start.bat` (Node.js 22.13 or newer):

```
npm install
npm start
```

## Notes

- The server listens on `127.0.0.1` only, so it cannot be reached from other computers.
- Saved connections are kept in `connections.json`, in plain text when "Remember password" is ticked.
  The file is not part of the repository.
- To use another port, change `port` in `config.json`.
