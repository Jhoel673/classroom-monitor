const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// 🔗 MongoDB
mongoose.connect("mongodb+srv://admin1:admin12345@classroom-monitor.5c128wf.mongodb.net/classroom?retryWrites=true&w=majority")
  .then(() => console.log("🟢 MongoDB conectado"))
  .catch(err => console.log("🔴 Error MongoDB", err));

app.use(cors());
app.use(express.json());

// 📊 memoria temporal
let tiempoSitios = {};
let estados = {};
let historial = {};
let usuarios = {};

app.post("/login", (req, res) => {

  const { nombre, clase, password, deviceId } = req.body;

  if (!nombre || !clase || !password || !deviceId) {
    return res.json({ ok: false, msg: "datos incompletos" });
  }

  const key = nombre + "-" + clase;

  if (!usuarios[key]) {
    usuarios[key] = {
      nombre,
      clase,
      password,
      deviceId
    };
  }

  if (usuarios[key].password !== password) {
    return res.json({ ok: false, msg: "password incorrecta" });
  }

  usuarios[key].deviceId = deviceId;

  res.json({
    ok: true,
    user: usuarios[key]
  });

});

// 📡 actividad
app.post("/actividad", (req, res) => {

  const { nombre, clase, url } = req.body;

  if (!nombre || !clase || !url) {
    return res.json({ ok: false });
  }

  const estudiante = nombre + "-" + clase;

  let dominio;

  try {
    dominio = new URL(url).hostname;
  } catch {
    return res.json({ ok: false });
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

  sitio.tiempo += ahora - sitio.ultima;
  sitio.ultima = ahora;

  estados[estudiante] = Date.now();

  if (!historial[estudiante]) historial[estudiante] = [];

  historial[estudiante].push({
    url,
    hora: new Date().toLocaleTimeString()
  });

  if (historial[estudiante].length > 20) {
    historial[estudiante].shift();
  }

  io.emit("actividad", {
    tiempo: tiempoSitios,
    estados,
    historial
  });

  res.json({ ok: true });

});

// 📊 dashboard
app.get("/tiempo", (req, res) => {
  res.json(tiempoSitios);
});

// 🚀 server
server.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});