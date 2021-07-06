const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");
const nodemailer = require("nodemailer");
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

let transport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "iqbaldevly@gmail.com",
    pass: "iqbal 28877@@",
  },
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
  const cancelCollection = client
    .db(`${process.env.DB_NAME}`)
    .collection("cancelCollection");

  console.log("database");
  app.post("/agency", (req, res) => {
    ServiceCollection.insertMany(req.body);
  });
  app.get("/service", (req, res) => {
    ServiceCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.post("/editService/:id", (req, res) => {
    console.log(req.body);
    ServiceCollection.findOneAndUpdate(
      { _id: ObjectId(req.params.id) },
      {
        $set: { ...req.body },
      }
    );
  });
  app.delete("/deleteService/:id", (req, res) => {
    ServiceCollection.findOneAndDelete({ _id: ObjectId(req.params.id) }).then(
      (result) => res.send(result)
    );
  });
  app.get("/course/:id", (req, res) => {
    ServiceCollection.find({ _id: ObjectId(req.params.id) }).toArray(
      (err, documents) => {
        res.send(documents);
      }
    );
  });
  app.post("/selectPerson", (req, res) => {
    console.log(req.body.title);
    customerCollection
      .find({ title: req.body.title })
      .toArray((err, documents) => res.send(documents));
  });
  app.post("/customerDetails", (req, res) => {
    customerCollection.insertOne(req.body).then((result) => {
      let mailOptions = {
        from: "iqbaldevly@gmail.com",
        to: req.body.email,
        subject: "service seller confirmation mail",
        text: `
        Dear ${req.body.name},

        Welcome to ${req.body.title}!

        Thank you for registering! 

         We’d love to invite you to our Orientation. Dates and times are below. It’s a great opportunity to meet your instructors and other students. You can learn more about what this program will be like and ask any questions you have.

         Orientation date is ${req.body.title} . Your registration is confirmed.
        
       you session will started from ${req.body.startedDate}.`,
      };
      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("emil sent: " + info.response);
        }
      });
      res.send({ message: "Order successfully done" });
    });
  });
  app.post("/orderCancel", function (req, res) {
    console.log(req.body);
    cancelCollection.insertOne(req.body).then((result) => {
      let mailOptions = {
        from: "iqbaldevly@gmail.com",
        to: req.body.email,
        subject: "service seller confirmation mail for cancellation",
        text: `
          Dear ${req.body.name},
  
  
          Thank you for request!

          we reviewing your request after 72hour you will get your result. If your request is valid then you will get back the 90% money and 10%will be deducted`,
      };
      transport.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("emil sent: " + info.response);
        }
      });
      res.send({ message: "Order is request for cancel" });
    });
  });

  app.get("/cancelOrderList", (req, res) => {
    cancelCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.delete("/deleteCancelList/:id", (req, res) => {
    cancelCollection
      .findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then((result) => res.send(result));
  });
  app.delete("/deleteOrderlList", (req, res) => {
    customerCollection
      .findOneAndDelete({ title: req.body.title, email: req.body.email })
      .then((result) => res.send(result));
  });

  app.post("/orderStatus/:id", (req, res) => {
    customerCollection
      .findOneAndUpdate(
        { _id: ObjectId(req.params.id) },
        {
          $set: { muteStatus: req.body.muteStatus },
        }
      )
      .then(() => res.send(req.body.status))
      .catch((err) => console.error(err));
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
      res.send(result.CommandResult.ops);
    });
  });
  app.get("/commentsDetails", (req, res) => {
    commentsCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });
  app.get("/customerDetails", (req, res) => {
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
  app.delete("/mentor/:id", (req, res) => {
    mentorCollection
      .findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then((result) => res.send(result));
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
    if (req.body.status) {
      customerCollection
        .findOneAndUpdate(
          { _id: ObjectId(req.params.id) },
          {
            $set: { status: req.body.status },
          }
        )
        .then(() => res.send(req.body.status))
        .catch((err) => console.error(err));
    } else {
      customerCollection
        .findOneAndUpdate(
          { _id: ObjectId(req.params.id) },
          {
            $set: { muteStatus: req.body.muteStatus },
          }
        )
        .then(() => res.send(req.body.status))
        .catch((err) => console.error(err));
    }
  });
  app.delete("/delete/:id", (req, res) => {
    console.log(req.params.id);
    customerCollection
      .findOneAndDelete({ _id: ObjectId(req.params.id) })
      .then((result) => res.send(result));
  });
  app.post("/newService", (req, res) => {
    console.log(req.body.date);
    const title = req.body.title;
    const price = req.body.price;
    const description = req.body.description;
    const duration = req.body.duration;
    const language = req.body.language;
    const mentorName = req.body.mentorName;
    const courseOutline = req.body.courseOutline;
    const date = req.body.date;
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
        date,
      }).then((result) => {
        res.send({ message: "successfully created" });
      });
    });
  });
});

app.listen(process.env.PORT || port);
