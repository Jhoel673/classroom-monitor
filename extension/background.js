const SERVER_URL = "https://classroom-monitor-bcfi.onrender.com";

function obtenerEstudiante(callback) {
  chrome.storage.local.get(["nombre", "clase"], (res) => {
    callback({
      nombre: res.nombre,
      clase: res.clase
    });
  });
}

function enviar(url) {

  if (!url) return;

  obtenerEstudiante((estudiante) => {

    if (!estudiante.nombre || !estudiante.clase) {
      console.log("⚠️ estudiante no configurado");
      return;
    }

    fetch(`${SERVER_URL}/actividad`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre: estudiante.nombre,
        clase: estudiante.clase,
        url: url
      })
    })
    .then(() => {
      console.log("✅ enviado:", estudiante);
    })
    .catch((err) => {
      console.log("❌ error:", err);
    });

  });

}

// 🔁 pestaña activa
chrome.tabs.onActivated.addListener(async (info) => {
  const tab = await chrome.tabs.get(info.tabId);
  enviar(tab.url);
});

// 🔁 cambio URL
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    enviar(changeInfo.url);
  }
});