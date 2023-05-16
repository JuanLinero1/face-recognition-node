const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();
const port = 4000;
const cors = require("cors");
const db = (knex = require("knex")({
  client: "pg",
  connection: {
    name: "dpg-chdpiq3hp8u3v73c3fd0-a",
    host: "dpg-chdpiq3hp8u3v73c3fd0-a.oregon-postgres.render.com",
    port: 5432,
    user: "face_recognition_host_user",
    password: "Z9KjjDZYMNBSPBMAz9m9nnXzBIobtcBe",
    database: "face_recognition_host",
    ssl: true,
  },
}));

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("success"); //thanks god
});

const bring = async () => {
  const response = await db.select('*').from('users')
  console.log(response)
}
bring()

app.post("/signIn", (req, res) => {
  console.log(req.body.userEmail);
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
  console.log(req.body);
  if (!userName || !userEmail || !userPassword) {
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

let counter = 0
app.put("/image", async (req, res) => {
  const { reqId } = req.body;
  let found = false;
  counter++
  const response = await db("users").select("*");
  await response.forEach(async (element) => {
    if (element.id == reqId) {
      found = true;
      element.entries = counter;
      const update = db("users").where({"id": element.id}).update({'entries': counter}, ['id', 'entries'])
      return res.json(await update);
    }
  });
  if (!found) {
    res.json("there was an error");
  }
});

app.listen(port, () => {
  console.log("app is running on port " + port);
});
