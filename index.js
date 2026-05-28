const express = require("express");
const cors = require("cors");

const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();

/* =========================
   MONGODB
========================= */

const uri =
  "mongodb://admin1:admin12345@ac-q4oexkv-shard-00-00.5c128wf.mongodb.net:27017,ac-q4oexkv-shard-00-01.5c128wf.mongodb.net:27017,ac-q4oexkv-shard-00-02.5c128wf.mongodb.net:27017/?ssl=true&replicaSet=atlas-17f5wx-shard-0&authSource=admin&appName=classroom-monitor";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let collection;

/* =========================
   CONECTAR
========================= */

async function conectarMongo() {

  try {

    await client.connect();

    console.log("🟢 MongoDB conectado");

    const db = client.db("classroom");

    collection = db.collection("actividad");

  } catch (err) {

    console.log("🔴 Error MongoDB", err);

  }

}

conectarMongo();

/* =========================
   CONFIG
========================= */

app.use(cors());
app.use(express.json());

/* =========================
   MEMORIA
========================= */

let tiempoSitios = {};
let ultimoMovimiento = {};
/* =========================
   ACTIVIDAD
========================= */

app.post("/actividad", async (req, res) => {

  const { estudiante, url } = req.body;
io.emit("actividad", tiempoSitios);
  if (!estudiante || !url) {
    return res.json({ ok: false });
  }

  if (
    url.includes("chrome://") ||
    url.includes("127.0.0.1") ||
    url.includes("localhost")
  ) {
    return res.json({ ok: false });
  }

  let dominio;

  try {
    dominio = new URL(url).hostname;
  } catch {
    dominio = "desconocido";
  }

  if (!tiempoSitios[estudiante]) {
    tiempoSitios[estudiante] = {};
  }

  if (!tiempoSitios[estudiante][dominio]) {

    tiempoSitios[estudiante][dominio] = {
      tiempo: 0,
      ultima: Date.now()
    };

  }

  const sitio = tiempoSitios[estudiante][dominio];

  const ahora = Date.now();
  ultimoMovimiento[estudiante] = ahora;
  const diff = ahora - sitio.ultima;

  sitio.tiempo += diff;

  sitio.ultima = ahora;

  /* =========================
     GUARDAR EN MONGO
  ========================= */

  if (collection) {

    await collection.updateOne(

      {
        estudiante,
        dominio
      },

      {
        $inc: {
          tiempo: diff
        },

        $set: {
          ultima: Date.now()
        }
      },

      {
        upsert: true
      }

    );

  }

  console.log(tiempoSitios);

  res.json({
    ok: true
  });

});

/* =========================
   VER MEMORIA
========================= */

app.get("/tiempo", (req, res) => {

  res.json(tiempoSitios);

});

/* =========================
   VER MONGODB
========================= */

app.get("/mongo", async (req, res) => {

  if (!collection) {
    return res.json([]);
  }

  const datos = await collection.find().toArray();

  res.json(datos);

});

/* =========================
   SERVER
========================= */
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

server.listen(3000, () => {

  console.log("🚀 Server running on http://localhost:3000");

});