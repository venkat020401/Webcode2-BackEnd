const express = require("express");
const app = express();
const mongodb = require("mongodb");
const dotenv = require("dotenv").config();
const mongoclient = mongodb.MongoClient;
const URL = process.env.DB;
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECURT = process.env.jwt_secret;

//midleware
app.use(express.json());
app.use(
  cors({
    origin: "https://webcodetwo2512.netlify.app/",
  })
);

const authorize = (req, res, next) => {
  if (req.headers.authorization) {
    try {
      const verify = jwt.verify(req.headers.authorization, SECURT);
      if (verify) {
        next();
      }
    } catch (error) {
      res.json({ message: "unautrhorized" });
    }
  } else {
    res.json({ message: "unautrhorized" });
  }
};

//get products
app.get("/products", authorize, async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("products");
    // do operations
    const users = await collection
      .find({
        $or: [
          {
            isDeleted: { $exists: false },
          },
          {
            isDeleted: false,
          },
        ],
      })
      .toArray();

    //close connection
    await connection.close();

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//Add product
app.post("/add-product", authorize, async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("products");
    // do operations
    const added_products = await collection.insertOne({
      ...req.body,
      isDeleted: false,
    });

    //close connection
    await connection.close();

    res.json({ message: "product added", added_products });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// remove product
app.delete("/remove-product/:id", authorize, async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("products");
    // do operations
    const deleteitems = await collection.findOneAndUpdate(
      { _id: mongodb.ObjectId(req.params.id) },
      { $set: { isDeleted: true } }
    );
    //close connection
    await connection.close();

    res.json(deleteitems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//get single product
app.get("/get-product/:id", async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("products");
    // do operations
    const single_product = await collection
      .find({ _id: mongodb.ObjectId(req.params.id) })
      .toArray();
    //close connection
    await connection.close();

    res.json(single_product);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// Edit single product
app.put("/update-product/:id", async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("products");
    // do operations
    const update = await collection.findOneAndUpdate(
      { _id: mongodb.ObjectId(req.params.id) },
      {
        $set: req.body,
      }
    );
    //close connection
    await connection.close();

    res.json(update);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//add to cart
app.post("/addtocart/:id", async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("products");
    const collection2 = db.collection("product-cart");
    // do operations
    const product = await collection
      .find({ _id: mongodb.ObjectId(req.params.id) })
      .toArray();
    await collection2.insertOne({ product });
    //close connection
    await connection.close();

    res.json({ product, message: "item added to cart" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//get items from cart
app.get("/get_cart_items", authorize, async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("product-cart");
    // do operations
    const cartitems = await collection.find({}).toArray();
    //close connection
    await connection.close();

    res.json(cartitems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

//remove item from cart
app.delete("/remove_cart_item/:id", authorize, async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("product-cart");
    // do operations
    const deleteitems = await collection.deleteOne({
      _id: mongodb.ObjectId(req.params.id),
    });
    //close connection
    await connection.close();

    res.json(deleteitems);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// user register
app.post("/user-register", async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("app_users");
    // do operations
    const salt1 = await bcrypt.genSalt(10);
    const hash1 = await bcrypt.hash(req.body.password, salt1);
    req.body.password = hash1;
    const salt2 = await bcrypt.genSalt(10);
    const hash2 = await bcrypt.hash(req.body.confirm_password, salt2);
    req.body.password = hash1;
    req.body.confirm_password = hash2;
    const users = await collection.insertOne(req.body);
    //close connection
    await connection.close();

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// admin register
app.post("/admin-register", async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("admin_users");
    // do operations
    const salt1 = await bcrypt.genSalt(10);
    const hash1 = await bcrypt.hash(req.body.password, salt1);
    req.body.password = hash1;
    const salt2 = await bcrypt.genSalt(10);
    const hash2 = await bcrypt.hash(req.body.confirm_password, salt2);
    req.body.password = hash1;
    req.body.confirm_password = hash2;
    const users = await collection.insertOne(req.body);
    //close connection
    await connection.close();

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// admin login
app.post("/admin-login", async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("admin_users");
    // do operations
    const user = await collection.findOne({ email: req.body.email });
    if (user) {
      const compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        // generate token
        const token = jwt.sign({ id: user._id }, SECURT);
        res.json({ message: "Login success", token });
      } else {
        alert("email/password wrong");
        res.json({ message: "email/password wrong" });
      }
    } else {
      alert("email/password wrong");
      res.status(401).json({ message: "email/password wrong" });
    }
    //close connection
    await connection.close();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// User Login
app.post("/user-login", async (req, res) => {
  try {
    // DB connection
    const connection = await mongoclient.connect(URL);
    // select db
    const db = connection.db("crm");
    // select collection
    const collection = db.collection("app_users");
    // do operations
    const user = await collection.findOne({ email: req.body.email });
    if (user) {
      const compare = await bcrypt.compare(req.body.password, user.password);
      if (compare) {
        // generate token
        const token = jwt.sign({ id: user._id }, SECURT);
        res.json({ message: "Login success", token });
      } else {
        alert("email/password wrong");
        res.json({ message: "email/password wrong" });
      }
    } else {
      alert("email/password wrong");
      res.status(401).json({ message: "email/password wrong" });
    }
    //close connection
    await connection.close();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

// set port.
app.listen(4000);
