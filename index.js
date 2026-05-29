const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

require("./keepAlive");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());

/* =========================
   MONGODB
========================= */

mongoose.connect("TU_URL_DE_MONGODB");

mongoose.connection.once("open", () => {
  console.log("🟢 MongoDB conectado");
});

/* =========================
   MODELO
========================= */

const ActividadSchema = new mongoose.Schema({

  estudiante: String,
  clase: String,
  dominio: String,
  tiempo: Number,
  ultima: Number

});

const Actividad = mongoose.model("Actividad", ActividadSchema);

/* =========================
   MEMORIA TIEMPO REAL
========================= */

let tiempoSitios = {};
let estados = {};
let historial = {};

/* =========================
   RUTA PRINCIPAL
========================= */

app.get("/", (req, res) => {
  res.send("🟢 Classroom Monitor Pro funcionando");
});

/* =========================
   ACTIVIDAD
========================= */

app.post("/actividad", async (req, res) => {

  try {

    const { nombre, clase, url } = req.body;

    // validar datos
    if (!nombre || !clase || !url) {
      return res.json({ ok: false });
    }

    // nombre final
    const estudiante = `${nombre} - ${clase}`;

    // extraer dominio
    let dominio;

    try {
      dominio = new URL(url).hostname;
    } catch {
      dominio = url;
    }

    // estado activo
    estados[estudiante] = Date.now();

    /* =========================
       HISTORIAL
    ========================= */

    if (!historial[estudiante]) {
      historial[estudiante] = [];
    }

    historial[estudiante].push({
      url: dominio,
      hora: new Date().toLocaleTimeString()
    });

    // limitar historial
    if (historial[estudiante].length > 20) {
      historial[estudiante].shift();
    }

    /* =========================
       TIEMPO POR SITIO
    ========================= */

    if (!tiempoSitios[estudiante]) {
      tiempoSitios[estudiante] = {};
    }

    if (!tiempoSitios[estudiante][dominio]) {

      tiempoSitios[estudiante][dominio] = {
        tiempo: 0,
        ultima: Date.now()
      };

    }

    const actual = tiempoSitios[estudiante][dominio];

    const ahora = Date.now();

    const diff = ahora - actual.ultima;

    actual.tiempo += diff;

    actual.ultima = ahora;

    /* =========================
       GUARDAR EN MONGODB
    ========================= */

    await Actividad.findOneAndUpdate(

      {
        estudiante,
        dominio
      },

      {
        estudiante,
        clase,
        dominio,
        tiempo: actual.tiempo,
        ultima: ahora
      },

      {
        upsert: true
      }

    );

    /* =========================
       SOCKET REALTIME
    ========================= */

    io.emit("actividad", {
      tiempo: tiempoSitios,
      estados,
      historial
    });

    console.log("✅ actividad:", estudiante, dominio);

    res.json({ ok: true });

  } catch (err) {

    console.log("❌ error actividad:", err);

    res.status(500).json({
      ok: false
    });

  }

});

/* =========================
   SOCKET
========================= */

io.on("connection", (socket) => {

  console.log("🟢 dashboard conectado");

  socket.emit("actividad", {
    tiempo: tiempoSitios,
    estados,
    historial
  });

});

/* =========================
   START
========================= */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

/* =========================
   SEGURIDAD ANTI-CRASH
========================= */

process.on("uncaughtException", (err) => {
  console.log("🔥 Error no controlado:", err);
});

process.on("unhandledRejection", (err) => {
  console.log("🔥 Promesa fallida:", err);
});