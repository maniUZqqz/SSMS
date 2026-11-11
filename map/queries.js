'use strict';
// Read-only catalog queries for the database map. Everything the map knows about a structure comes from these.
// They run with the target database as the current database.

const typeExpr = a => `CASE
    WHEN ty.name IN ('varchar','char','varbinary','binary') THEN ty.name + '(' + CASE WHEN ${a}.max_length = -1 THEN 'max' ELSE CAST(${a}.max_length AS varchar(10)) END + ')'
    WHEN ty.name IN ('nvarchar','nchar') THEN ty.name + '(' + CASE WHEN ${a}.max_length = -1 THEN 'max' ELSE CAST(${a}.max_length / 2 AS varchar(10)) END + ')'
    WHEN ty.name IN ('decimal','numeric') THEN ty.name + '(' + CAST(${a}.precision AS varchar(10)) + ',' + CAST(${a}.scale AS varchar(10)) + ')'
    WHEN ty.name IN ('datetime2','time','datetimeoffset') AND ${a}.scale <> 7 THEN ty.name + '(' + CAST(${a}.scale AS varchar(10)) + ')'
    ELSE ty.name END`;

const ROUTINE_TYPES = `'P','FN','IF','TF','PC','FS','FT'`;

// One cheap row that changes whenever the structure changes (objects added/dropped/altered, columns, relations).
exports.FINGERPRINT = `SELECT (SELECT COUNT(*) FROM sys.objects WHERE is_ms_shipped = 0) AS n,
       (SELECT CONVERT(varchar(23), MAX(modify_date), 126) FROM sys.objects WHERE is_ms_shipped = 0) AS m,
       (SELECT COUNT(*) FROM sys.columns) AS c,
       (SELECT COUNT(*) FROM sys.foreign_keys) AS f`;

// Databases on the server that this login may open (system databases left out).
exports.DATABASES = `SELECT name FROM sys.databases WHERE database_id > 4 AND state = 0 AND HAS_DBACCESS(name) = 1 ORDER BY name`;

exports.ALL = {
  info: `SELECT DB_NAME() AS db, CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(40)) AS version,
       CAST(SERVERPROPERTY('Edition') AS nvarchar(80)) AS edition, GETDATE() AS server_time`,

  objects: `SELECT o.object_id AS id, s.name AS sch, o.name, RTRIM(o.type) AS kind, o.create_date AS created, o.modify_date AS modified,
       (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id = o.object_id AND p.index_id IN (0,1)) AS row_count,
       (SELECT TOP 1 CAST(ep.value AS nvarchar(4000)) FROM sys.extended_properties ep
         WHERE ep.class = 1 AND ep.major_id = o.object_id AND ep.minor_id = 0 AND ep.name = 'MS_Description') AS descr
FROM sys.objects o
JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE o.type IN ('U','V') AND o.is_ms_shipped = 0
ORDER BY s.name, o.name`,

  columns: `SELECT c.object_id AS id, c.name, ${typeExpr('c')} AS typ,
       c.is_nullable AS nullable, c.is_identity AS ident, c.is_computed AS computed,
       dc.definition AS dflt, cc.definition AS formula, CAST(ep.value AS nvarchar(4000)) AS descr
FROM sys.columns c
JOIN sys.objects o ON o.object_id = c.object_id AND o.type IN ('U','V') AND o.is_ms_shipped = 0
JOIN sys.types ty ON ty.user_type_id = c.user_type_id
LEFT JOIN sys.default_constraints dc ON dc.object_id = c.default_object_id
LEFT JOIN sys.computed_columns cc ON cc.object_id = c.object_id AND cc.column_id = c.column_id
LEFT JOIN sys.extended_properties ep ON ep.class = 1 AND ep.major_id = c.object_id AND ep.minor_id = c.column_id AND ep.name = 'MS_Description'
ORDER BY c.object_id, c.column_id`,

  keys: `SELECT kc.parent_object_id AS id, kc.name, RTRIM(kc.type) AS kind, c.name AS col
FROM sys.key_constraints kc
JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
ORDER BY kc.parent_object_id, kc.name, ic.key_ordinal`,

  fks: `SELECT fk.object_id AS fk_id, fk.name, fk.parent_object_id AS p, fk.referenced_object_id AS r, pc.name AS pcol, rc.name AS rcol,
       fk.delete_referential_action_desc AS on_delete, fk.update_referential_action_desc AS on_update,
       fk.is_disabled AS disabled, fk.is_not_trusted AS untrusted
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
JOIN sys.columns pc ON pc.object_id = fkc.parent_object_id AND pc.column_id = fkc.parent_column_id
JOIN sys.columns rc ON rc.object_id = fkc.referenced_object_id AND rc.column_id = fkc.referenced_column_id
ORDER BY fk.parent_object_id, fk.name, fk.object_id, fkc.constraint_column_id`,

  indexes: `SELECT i.object_id AS id, i.index_id AS ix, i.name, i.type_desc AS typ, i.is_unique AS uq, i.is_primary_key AS pk,
       i.filter_definition AS filter, c.name AS col, ic.is_included_column AS inc, ic.is_descending_key AS dsc
FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id AND t.is_ms_shipped = 0
JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
WHERE i.type > 0 AND i.is_hypothetical = 0
ORDER BY i.object_id, i.index_id, ic.is_included_column, ic.key_ordinal, ic.index_column_id`,

  checks: `SELECT cc.parent_object_id AS id, cc.name, cc.definition, cc.is_disabled AS disabled
FROM sys.check_constraints cc
ORDER BY cc.parent_object_id, cc.name`,

  triggers: `SELECT tr.object_id AS tid, tr.parent_id AS id, tr.name, tr.is_disabled AS disabled, tr.is_instead_of_trigger AS instead_of, te.type_desc AS ev
FROM sys.triggers tr
LEFT JOIN sys.trigger_events te ON te.object_id = tr.object_id
WHERE tr.parent_class = 1
ORDER BY tr.parent_id, tr.name, te.type`,

  routines: `SELECT o.object_id AS id, s.name AS sch, o.name, o.type_desc AS kind, o.create_date AS created, o.modify_date AS modified
FROM sys.objects o
JOIN sys.schemas s ON s.schema_id = o.schema_id
WHERE o.type IN (${ROUTINE_TYPES}) AND o.is_ms_shipped = 0
ORDER BY s.name, o.name`,

  params: `SELECT p.object_id AS id, p.parameter_id AS pos, p.name, ${typeExpr('p')} AS typ, p.is_output AS is_out
FROM sys.parameters p
JOIN sys.objects o ON o.object_id = p.object_id AND o.is_ms_shipped = 0 AND o.type IN (${ROUTINE_TYPES})
JOIN sys.types ty ON ty.user_type_id = p.user_type_id
ORDER BY p.object_id, p.parameter_id`,

  modules: `SELECT m.object_id AS id, m.definition
FROM sys.sql_modules m
JOIN sys.objects o ON o.object_id = m.object_id
WHERE o.is_ms_shipped = 0 AND m.definition IS NOT NULL`,
};
