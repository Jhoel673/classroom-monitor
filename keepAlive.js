const https = require("https");

setInterval(() => {

  https.get("https://classroom-monitor-bcfi.onrender.com", (res) => {
    console.log("🔄 Ping al servidor:", res.statusCode);
  }).on("error", (err) => {
    console.log("❌ Error ping:", err.message);
  });

}, 5 * 60 * 1000); // cada 5 minutos