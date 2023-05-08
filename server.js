const express = require("express");
const app = express();
const port = http.createServer(process.env.PORT || 3000);
const cors = require("cors");
const db = (knex = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "Juan Linero",
    password: "q#@&FT8prcc?3tSk",
    database: "face-recognition",
  },
}));

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(express.json());
app.use(cors());

app.post("/signIn", (req, res) => {
  db.select("email", "password")
    .from("login")
    .where("email", "=", req.body.email)
    .then((data) => {
      const isValid = bcrypt.compareSync(req.body.password, data[0].password);
      if (isValid) {
        return db
          .select("*")
          .from("users")
          .where("email", "=", req.body.email)
          .then((user) => {
            res.json(user[0]);
          })
          .catch((err) => {
            res.status(400).json("unable to get user");
          });
      } else {
        res.status(400).json("wrong credential");
      }
    })
    .catch((err) => {
      res.status(400).json("wrong credentials");
    });
});
app.post("/register", async (req, res) => {
  const { userName, userEmail, userPassword } = req.body;
  if(!userName || !userEmail || !userPassword){
    return res.status(403).json("incorrect credentials");
  }

  try {
    bcrypt.hash(userPassword, saltRounds, async (err, hash) => {
      if (hash) {
        db.transaction((trx) => {
          trx
            .insert({
              email: userEmail,
              password: hash,
            })
            .into("login")
            .returning("email")
            .then(async (loginEmail) => {
              const dbResponse = await trx("users").returning("*").insert({
                email: loginEmail[0].email,
                name: userName,
                password: hash,
                joined: new Date(),
              });
              const data = await dbResponse;
              console.log(data);
            })
            .then(trx.commit)
            .catch(trx.rollback);
        });
      } else {
        console.log(err);
      }
    });
    return res.status(200).send("success");
  } catch (err) {
    console.log(err);
    return res.status(400).send("error");
  }
});
app.get("/profile::id", (req, res) => {
  const { id } = req.params;
  console.log(id);
  let found = false;
  database.users.forEach((element) => {
    if (element.id == id) {
      found = true;
      serverResponse = {
        userName: element.name,
        userEntries: element.entries,
      };
      res.status(200).json({ serverResponse });
    }
  });
  if (!found) {
    res.json("not found");
  }
});
app.put("/image", (req, res) => {
  const { reqId } = req.body;
  let found = false;
  console.log(reqId);
  database.users.forEach((element) => {
    if (element.id == reqId) {
      found = true;
      element.entries++;
      console.log(true, element.id + " " + reqId, element.entries);
      return res.json(element.entries);
    }
  });
  if (!found) {
    res.json("there waas an error");
  }
});
app.listen(port, () => {
  console.log("app is running on port " + port);
});
