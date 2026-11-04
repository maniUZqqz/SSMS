// T-SQL vocabulary and syntax highlighting.

const words = s => s.trim().split(/\s+/);

export const KEYWORD_LIST = words(`ADD ALL ALTER AND ANY APPLY AS ASC AUTHORIZATION BACKUP BEGIN BETWEEN BREAK BROWSE BULK BY
  CASCADE CASE CAST CATCH CHECK CHECKPOINT CLOSE CLUSTERED COLLATE COLUMN COMMIT COMMITTED COMPUTE CONSTRAINT CONTAINS
  CONTINUE CONVERT CREATE CROSS CURRENT CURSOR DATABASE DBCC DEALLOCATE DECLARE DEFAULT DELETE DENY DESC DISABLE DISTINCT
  DISTRIBUTED DOUBLE DROP ELSE ENABLE END ERRLVL ESCAPE EXCEPT EXEC EXECUTE EXISTS EXIT EXTERNAL FETCH FILE FILLFACTOR FIRST
  FOR FOREIGN FREETEXT FROM FULL FUNCTION GO GOTO GRANT GROUP HAVING HOLDLOCK IDENTITY IDENTITY_INSERT IF IN INCLUDE
  INDEX INNER INSERT INTERSECT INTO IS ISOLATION JOIN KEY KILL LEFT LEVEL LIKE LOCAL MATCHED MERGE NEXT NOCHECK NOCOUNT
  NOLOCK NONCLUSTERED NOT NULL OF OFF OFFSET ON ONLY OPEN OPTION OR ORDER OUTER OUTPUT OVER PARTITION PERCENT PIVOT PLAN
  PRIMARY PRINT PROC PROCEDURE PUBLIC RAISERROR READ READONLY REBUILD RECOMPILE RECONFIGURE REFERENCES REPEATABLE
  REPLICATION RESTORE RETURN RETURNS REVERT REVOKE RIGHT ROLLBACK ROW ROWCOUNT ROWS RULE SAVE SCHEMA SELECT SEQUENCE
  SERIALIZABLE SET SETUSER SHUTDOWN SNAPSHOT SOME STATISTICS SYNONYM TABLE TABLESAMPLE TEXTSIZE THEN THROW TIES TO TOP
  TRAN TRANSACTION TRIGGER TRUNCATE TRY UNCOMMITTED UNION UNIQUE UNPIVOT UPDATE USE USING VALUES VARYING VIEW WAITFOR
  WHEN WHERE WHILE WITH XACT_ABORT`);
export const TYPE_LIST = words(`BIGINT BINARY BIT CHAR DATE DATETIME DATETIME2 DATETIMEOFFSET DECIMAL FLOAT GEOGRAPHY GEOMETRY
  HIERARCHYID IMAGE INT MONEY NCHAR NTEXT NUMERIC NVARCHAR REAL ROWVERSION SMALLDATETIME SMALLINT SMALLMONEY SQL_VARIANT
  SYSNAME TEXT TIME TIMESTAMP TINYINT UNIQUEIDENTIFIER VARBINARY VARCHAR XML MAX`);
export const FUNC_LIST = words(`ABS AVG CEILING CHARINDEX CHOOSE COALESCE CONCAT CONCAT_WS COUNT COUNT_BIG CURRENT_TIMESTAMP
  CURRENT_USER DATALENGTH DATEADD DATEDIFF DATEFROMPARTS DATENAME DATEPART DAY DB_ID DB_NAME DENSE_RANK EOMONTH
  ERROR_LINE ERROR_MESSAGE ERROR_NUMBER ERROR_PROCEDURE ERROR_SEVERITY ERROR_STATE FIRST_VALUE FLOOR FORMAT GETDATE
  GETUTCDATE GROUPING HASHBYTES IIF ISJSON ISNULL ISNUMERIC JSON_QUERY JSON_VALUE LAG LAST_VALUE LEAD LEN LOWER LTRIM
  MIN MONTH NEWID NTILE NULLIF OBJECT_ID OBJECT_NAME OPENJSON PARSE PATINDEX POWER QUOTENAME RANK REPLACE REPLICATE
  REVERSE ROUND ROW_NUMBER RTRIM SCHEMA_NAME SCOPE_IDENTITY SESSION_USER SIGN SPACE SQRT STR STRING_AGG STRING_SPLIT STUFF
  SUBSTRING SUM SUSER_NAME SYSDATETIME SYSDATETIMEOFFSET SYSTEM_USER TRANSLATE TRIM TRY_CAST TRY_CONVERT TRY_PARSE UPPER
  USER_NAME YEAR`);
export const KEYWORDS = new Set(KEYWORD_LIST);
// SSMS shows logical operators and join keywords in gray.
const OPERATORS = new Set(words('AND OR NOT IN LIKE BETWEEN EXISTS IS NULL ALL ANY SOME JOIN INNER OUTER LEFT RIGHT CROSS FULL'));
export const TYPES = new Set(TYPE_LIST);
export const FUNCS = new Set(FUNC_LIST);

export const TOKEN = /(--[^\n]*)|(\/\*[\s\S]*?(?:\*\/|$))|(N?'(?:[^']|'')*'?)|(\[(?:[^\]\n]|\]\])*\]?|"(?:[^"\n]|"")*"?)|(@@?[\w#$@]*)|(0x[0-9a-f]*|\b\d+(?:\.\d*)?(?:e[+-]?\d+)?)|([a-z_#][\w#$@]*)/gi;

export const escHtml = s => s.replace(/[&<>]/g, c => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'));

// JavaScript (MongoDB shell) and Redis command highlighting.
const JS_TOKEN = /(\/\/[^\n]*)|(\/\*[\s\S]*?(?:\*\/|$))|('(?:[^'\\\n]|\\.)*'?|"(?:[^"\\\n]|\\.)*"?|`(?:[^`\\]|\\.)*`?)|(\$[\w.]+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)/g;
const JS_KEYWORDS = new Set(words('const let var function return await async if else for while of in new true false null undefined this typeof'));
const JS_GLOBALS = new Set(words('db use print printjson ObjectId ISODate NumberLong NumberInt NumberDecimal UUID Date Math JSON'));
const REDIS_TOKEN = /(#[^\n]*|\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"?|'[^'\n]*'?)|(\b\d+(?:\.\d+)?\b)|(^[ \t]*[A-Za-z.]+)/gm;

function highlightWith(src, re, classify) {
  let out = '', last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(src))) {
    const s = m[0];
    if (!s) { re.lastIndex++; continue; }
    if (m.index > last) out += escHtml(src.slice(last, m.index));
    const cls = classify(m, s);
    out += cls ? `<span class="${cls}">${escHtml(s)}</span>` : escHtml(s);
    last = m.index + s.length;
  }
  return out + escHtml(src.slice(last));
}

export function highlight(src, mode = 'sql') {
  if (src.length > 500000) return escHtml(src);
  if (mode === 'js') {
    return highlightWith(src, JS_TOKEN, (m, s) => (m[1] || m[2] ? 'c' : m[3] ? 's' : m[4] ? 'v' : m[5] ? 'n' : JS_KEYWORDS.has(s) ? 'k' : JS_GLOBALS.has(s) ? 'f' : null));
  }
  if (mode === 'redis') return highlightWith(src, REDIS_TOKEN, m => (m[1] ? 'c' : m[2] ? 's' : m[3] ? 'n' : m[4] ? 'k' : null));
  let out = '', last = 0, m;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(src))) {
    const s = m[0];
    if (!s) { TOKEN.lastIndex++; continue; }
    if (m.index > last) out += escHtml(src.slice(last, m.index));
    let cls = null;
    if (m[1] || m[2]) cls = 'c';
    else if (m[3]) cls = 's';
    else if (m[5]) cls = 'v';
    else if (m[6]) cls = 'n';
    else if (m[7]) {
      const u = s.toUpperCase();
      cls = OPERATORS.has(u) ? 'o' : KEYWORDS.has(u) ? 'k' : TYPES.has(u) ? 't' : FUNCS.has(u) ? 'f' : null;
    }
    out += cls ? `<span class="${cls}">${escHtml(s)}</span>` : escHtml(s);
    last = m.index + s.length;
  }
  return out + escHtml(src.slice(last));
}

// Names that are not plain identifiers (or are reserved words) need brackets.
export function quoteIfNeeded(name) {
  return /^[A-Za-z_][\w@#$]*$/.test(name) && !KEYWORDS.has(name.toUpperCase()) ? name : '[' + name.replace(/]/g, ']]') + ']';
}
