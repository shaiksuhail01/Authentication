const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

app.use(express.json());
module.exports = app;
const db_path = path.join(__dirname, "userData.db");

let db = null;

const initalizeDbAndServer = async () => {
  try {
    db = await open({
      filename: db_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server is Running!`);
    });
  } catch (error) {
    console.log(`Database Error ${error.message}`);
  }
};
initalizeDbAndServer();

//API 1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const passwordLength = password.length;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    if (passwordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const inserQuery = `INSERT INTO user(username,name,password,gender,location)
            VALUES(
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`;
      await db.run(inserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCorrect === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const newPasswordLength = newPassword.length;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const checkUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(checkUserQuery);
  const isPasswordCorrect = await bcrypt.compare(oldPassword, dbUser.password);
  if (isPasswordCorrect === true) {
    if (newPasswordLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `UPDATE user SET password='${hashedNewPassword}'
     WHERE username='${username}'`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
