import express from "express";
import mysql from "mysql2/promise";
import session from "express-session";
import path from "path";
import bodyParser from "body-parser";

const app = express();
const __dirname = path.resolve();

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "mysql_ui_secret",
    resave: false,
    saveUninitialized: true,
  })
);

// routes
app.get("/", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: username,
      password: password || undefined,
    });
    req.session.dbUser = username;
    req.session.dbPass = password;
    res.redirect("/databases");
  } catch (err) {
    res.send("Login failed: " + err.message);
  }
});


app.get("/databases", async (req, res) => {
  if (!req.session.dbUser) return res.redirect("/");
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: req.session.dbUser,
      password: req.session.dbPass || undefined,
    });
    const [rows] = await conn.query("SHOW DATABASES");
    res.render("databases", { databases: rows });
  } catch (err) {
    res.send(err.message);
  }
});

// add database
app.get("/addDatabase", (req, res) => {
  if (!req.session.dbUser) return res.redirect("/");
  res.render("addDatabase");
});

app.post("/addDatabase", async (req, res) => {
  const { dbName } = req.body;
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: req.session.dbUser,
      password: req.session.dbPass || undefined,
    });
    await conn.query(`CREATE DATABASE ${dbName}`);
    res.redirect("/databases");
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/database/:name", async (req, res) => {
  const dbName = req.params.name;
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: req.session.dbUser,
      password: req.session.dbPass || undefined,
      database: dbName,
    });
    const [tables] = await conn.query("SHOW TABLES");
    res.render("databaseDetails", { dbName, tables });
  } catch (err) {
    res.send(err.message);
  }
});

app.post("/database/:name/addTable", async (req, res) => {
  const dbName = req.params.name;
  const { tableName } = req.body;
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: req.session.dbUser,
      password: req.session.dbPass || undefined,
      database: dbName,
    });
    await conn.query(`CREATE TABLE ${tableName} (id INT PRIMARY KEY AUTO_INCREMENT)`);
    res.redirect(`/database/${dbName}`);
  } catch (err) {
    res.send(err.message);
  }
});

app.get("/addUser", (req, res) => {
  if (!req.session.dbUser) return res.redirect("/");
  res.render("addUser");
});

app.post("/addUser", async (req, res) => {
  const { username, password } = req.body;
  try {
    const conn = await mysql.createConnection({
      host: "localhost",
      user: req.session.dbUser,
      password: req.session.dbPass || undefined,
    });
    await conn.query(`CREATE USER '${username}'@'localhost' IDENTIFIED BY '${password}'`);
    res.send(`User ${username} created successfully.`);
  } catch (err) {
    res.send(err.message);
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
