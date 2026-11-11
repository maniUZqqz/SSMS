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
- Database Map (3D) for SQL Server: the whole structure of a database as a 3D picture, kept in step with the
  real database automatically, with a row explorer (see below)

## Database Map (3D)

A 3D picture of a SQL Server database: every table is a sphere, every view a diamond, every foreign key a line,
and tables that belong together sit together. Open it from the toolbar, from **Tools → Database Map (3D)**, or by
right-clicking a database or a table in Object Explorer. The page is in Persian.

- **Structure.** Click a table to see its columns, keys, relations (in both directions), indexes, check
  constraints, triggers, and the procedures, functions and views that use it, with their SQL text. Search finds
  tables, views and columns.
- **Rows.** "سطرها (داده)" shows the rows of the table, newest first, with a filter. Click a row to follow it:
  the rows it points to through its foreign keys, and how many rows in other tables point to it. Click on from
  there to move from row to row; the tables involved stay lit in the picture. Everything is read-only.
- **Always current, without being asked.** The database you connect to is put on the map by itself (other
  databases with "افزودن دیتابیس"). The server then checks each mapped database every 5 minutes and reads the
  structure again only when something changed; the open page updates itself and keeps your viewpoint. Tables
  keep their place in the picture when the database grows. "تغییرات ساختار" lists what changed and when.
- **Kept on disk.** Each database has one complete structure document in `map-data\`, so the map still opens
  when the database cannot be reached (rows need the live database):
  - `<name>.json`: tables, columns, keys, relations, indexes, checks, triggers, views, procedures, functions
  - `<name>.code.json`: SQL text of views, procedures, functions and triggers
  - `<name>.changes.json`: what changed between one reading and the next

Automatic checking needs the connection's password to be saved ("Remember password") or the server to be
connected in the app. Settings, in `config.json`:

```json
{ "port": 5050, "map": { "auto": true, "checkEveryMinutes": 5 } }
```

`auto: false` stops databases from being added on connect. The row explorer needs SQL Server 2012 or newer.

The page's source is in `map-src\` and is bundled into `public\map\app.js`, which is part of the repository,
so nothing needs building to run the app. To change the map:

```
cd map-src
npm install
npm run build
```

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
- `map-data\` (the stored structures of mapped databases, including the SQL text of views and procedures) is
  not part of the repository either. It holds no passwords; mapped databases refer to a saved connection.
- To use another port, change `port` in `config.json`.
