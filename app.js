const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server listen http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const passwordValidate = (password) => {
  return password.length <= 4;
};

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserNameQuery = `SELECT * FROM user WHERE username = ${username};`;
  const userName = await db.get(getUserNameQuery);

  if (userName === undefined) {
    if (passwordValidate(password)) {
      const insertQuery = `
            INSERT INTO user (username,name,password,gender,location)
            VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(insertQuery);
      response.send("User created Sucessfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("username already exists");
  }
});

// API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserNameQuery = `
    SELECT * FROM user 
    WHERE username = '${username}';`;
  const getUserName = await db.get(getUserNameQuery);

  if (getUserName === undefined) {
    response.status(400);
    response.send("Invalid User");
  } else {
    const passwordMatched = await bcrypt.compare(
      password,
      getUserName.password
    );
    if (passwordMatched === true) {
      response.send("Login success!");
      response.send(200);
    } else {
      response.send("Invalid Password");
      response.status(400);
    }
  }
});

// API 3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const getQuery = `SELECT * FROM user 
    WHERE username = '${username};`;
  const dataQuery = await db.get(getQuery);

  if (dataQuery === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      getQuery.password
    );
    if (isPasswordMatched === true) {
      if (passwordValidate(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedPassword = `UPDATE user
                 SET password = '${hashedPassword}'
                WHERE username = '${username}';`;

        const user = await db.run(updatedPassword);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Password is too short");
      }
    } else {
      response.send("Invalid current Password");
    }
  }
});

module.exports = app;
