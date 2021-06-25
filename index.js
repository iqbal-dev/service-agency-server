const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");
const fs = require("fs-extra");
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j1hzz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.json({ limit: "1000mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "1000mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(express.static("doctors"));
app.use(fileUpload());
app.get("/", (req, res) => {
  res.send("hello service agency");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const ServiceCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("agencyCollection");
  const customerCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("customerCollection");
  const commentsCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("commentsCollection");
  const adminCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("adminCollection");
  const mentorCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("mentorCollection");

  console.log("database");
  app.post("/agency", (req, res) => {
    ServiceCollection.insertMany(req.body);
  });
  app.get("/service", (req, res) => {
    ServiceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.get("/course/:id", (req, res) => {
    ServiceCollection.find({ _id: ObjectId(req.params.id) }).toArray(
      (err, documents) => {
        res.send(documents);
      }
    );
  });
  app.post("/customerDetails", (req, res) => {
    console.log("====================================");
    console.log(req.body);
    console.log("====================================");
    customerCollection.insertOne(req.body).then((result) => {
      res.send({ message: "Order successfully done" });
    });
  });
  app.get("/orderlist", (req, res) => {
    customerCollection
      .find({ email: req.query.email })
      .toArray((err, document) => {
        res.send(document);
      });
  });
  app.post("/comments", (req, res) => {
    commentsCollection.insertOne(req.body).then((result) => {
      res.send(result);
    });
  });
  app.get("/commentsDetails", (req, res) => {
    commentsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/admin", (req, res) => {
    adminCollection
      .find({ email: req.body.email })
      .toArray((err, documents) => {
        res.send(documents);
      });
  });
  app.post("/findMentor", (req, res) => {
    mentorCollection
      .find({ mentorName: req.body.mentorName })
      .toArray((err, documents) => {
        res.send({ data: documents });
      });
  });
  app.post("/student", (req, res) => {
    customerCollection
      .find({ title: req.body.title })
      .toArray((err, documents) => {
        res.send({ data: documents });
      });
  });
  app.post("/addMentor", (req, res) => {
    const file = req.files.files;
    const mentorName = req.body.mentorName;
    const mentorDescription = req.body.mentorDescription;
    const expertise = req.body.expertise;
    const filePath = `${__dirname}/doctors/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
      }
      const newImg = req.files.files.data;
      const encImg = newImg.toString("base64");

      var image = {
        content: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, "base64"),
      };
      mentorCollection
        .insertOne({
          image,
          mentorName,
          mentorDescription,
          expertise,
        })
        .then((result) => {
          res.send({ message: "successfully created" });
        });
    });
  });
  app.get("/mentor", (req, res) => {
    mentorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/addAdmin", (req, res) => {
    adminCollection.insertOne(req.body).then((result) => {});
  });
  app.get("/allUser", (req, res) => {
    customerCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/status/:id", (req, res) => {
    customerCollection
      .findOneAndUpdate(
        { _id: ObjectId(req.params.id) },
        {
          $set: { status: req.body.status },
        }
      )
      .then(() => res.send(req.body.status))
      .catch((err) => console.error(err));
  });
  app.delete("/delete/:id", (req, res) => {
    console.log(req.params.id);
    customerCollection
      .findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then((result) => res.send(result));
  });
  app.post("/newService", (req, res) => {
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const duration = req.body.duration;
    const language = req.body.language;
    const mentorName = req.body.mentorName;
    const courseOutline = req.body.courseOutline;
    const file = req.files.files;
    const filePath = `${__dirname}/doctors/${file.name}`;
    file.mv(filePath, (err) => {
      if (err) {
        console.log(err);
      }
      const newImg = req.files.files.data;
      const encImg = newImg.toString("base64");

      var image = {
        content: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, "base64"),
      };
      ServiceCollection.insertOne({
        title,
        description,
        image,
        duration,
        language,
        mentorName,
        price,
        courseOutline,
      }).then((result) => {
        res.send({ message: "successfully created" });
      });
    });
  });
});

app.listen(process.env.PORT || port);
