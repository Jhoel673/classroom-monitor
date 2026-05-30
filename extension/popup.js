document.addEventListener("DOMContentLoaded", () => {

  const nombre = document.getElementById("nombre");
  const clase = document.getElementById("clase");
  const password = document.getElementById("password");
  const btn = document.getElementById("guardar");
  const estado = document.getElementById("estado");

  chrome.storage.local.get(["nombre", "clase", "password"], (res) => {

    if (res.nombre) nombre.value = res.nombre;
    if (res.clase) clase.value = res.clase;
    if (res.password) password.value = res.password;

    if (res.nombre) {
      estado.innerText = "👤 Guardado: " + res.nombre;
    }

  });

  btn.addEventListener("click", () => {

    const data = {
      nombre: nombre.value.trim(),
      clase: clase.value.trim(),
      password: password.value.trim()
    };

    if (!data.nombre || !data.clase || !data.password) {
      estado.innerText = "⚠️ Completa todos los campos";
      return;
    }

    chrome.storage.local.set(data, () => {
      estado.innerText = "✅ Guardado correctamente";
    });

  });

});