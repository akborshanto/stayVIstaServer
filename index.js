const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  Timestamp,
} = require("mongodb");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token);
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

//const uri = `mongodb+srv://}:${process.env.DB_PASS}@main.mq0mae1.mongodb.net/?retryWrites=true&w=majority&appName=Main`
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster1.phei2xm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

/* async function run() {
  try {


    const roomCollection=client.db('stayvista').collection('room')
    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
        console.log('Logout successful')
      } catch (err) {
        res.status(500).send(err)
      }
    })

  }
}
 */

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    /*     /* ========================================
                ALL COLLECTION NAME
    =====================================*/
    const roomCollection = client.db("stayvista").collection("room");
    const usersCollection = client.db("stayvista").collection("users");

    /* ========================================
                 USER COLLECTION ALL DATA
    =====================================*/

    /*put the user in user collection */

    app.get("/user", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    app.put("/user", async (req, res) => {
      const userData = req.body;
      const query = { email: userData?.email };

      //check if user is already Exists ,subsitst,remain,stay
      const isExist = await usersCollection.findOne({ email: userData?.email });

      if (isExist) {
        /*user  statuse updata */
        if (userData.status === "Requested") {
          const result = await usersCollection.updateOne(query, {
            $set: { status: userData.status },
          });
          return res.send(result);
        } else {
          res.send(isExist);
        }
      }

      //  if (isExist) return res.send(isExist);

      const option = { upsert: true };
      const updateDoc = {
        $set: { ...userData, Timestamp: Date.now(), updateAt: new Date() },
      };
      console.log(query);
      const result = await usersCollection.updateOne(query, updateDoc, option);
      console.log(result);
      res.send(result);
    });

    /* ========================================
                 ROOM COLLECTION ALL DATA
    =====================================*/
    app.get("/rooms", async (req, res) => {
      const category = req.query.category;
      let query = {};
      console.log(category);

      if (category && category !== "null") query = { category };
      const result = await roomCollection.find(query).toArray();
      res.send(result);
    });
    /* get the singe room data from roomCollection  */
    app.get("/room/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const consequence = await roomCollection.findOne(query);
      res.send(consequence);
    });

    /* POST THE DATA  In ROOOM COOLECTION DB  */
    app.post("/room", async (req, res) => {
      const query = req.body;
      console.log(query);
      const result = await roomCollection.insertOne(query);
      res.send(result);
    });
    /* Get The my listing data specipic uerer */

    app.get("/my-listings/:email", async (req, res) => {
      const email = req.params.email || "";
      // console.log(email)
      const query = { "host.email": email };
      // console.log(query)
      const resut = await roomCollection.find(query).toArray();
      res.send(resut);
    });

    /*DELETE The my listing data specipic uerer */
    app.delete("/my-List/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await roomCollection.deleteOne(query);
      res.send(result);
    });

    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    //  await client.close();
  }
}
//run().catch(console.dir);

// Send a ping to confirm a successful connection
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from StayVista Server..");
});

app.listen(port, () => {
  console.log(`StayVista is running on port ${port}`);
});
