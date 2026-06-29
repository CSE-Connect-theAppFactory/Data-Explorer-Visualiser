var jsonSql = require("json-sql")();

var sql = jsonSql.build({
  type: "select",
  table: "users",
  fields: ["name", "age"],
  condition: { name: "Max", id: 6 },
});

sql.query;
// sql string:
// select name, age from users where name = $p1 && id = 6;

sql.values;
// hash of values:
// { p1: 'Max' }
