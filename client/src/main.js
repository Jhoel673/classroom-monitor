import "./style.css";

const app = document.querySelector("#app");

let estudiantes = [];
let sesiones = {};
let estudianteSeleccionado = null;

let filtro = "";
let tiempoFuera = 0;
let fueraDePestana = false;

// =========================
// CARGAR ESTUDIANTES
// =========================
async function cargarEstudiantes() {

  const respuesta = await fetch("http://localhost:3000/estudiantes");

  estudiantes = await respuesta.json();

  render();

}

// =========================
// CARGAR ACTIVIDAD
// =========================
async function cargarActividad() {

  const respuesta = await fetch("http://localhost:3000/actividad");

  actividad = await respuesta.json();

  render();

}

// =========================
// AGREGAR ESTUDIANTE
// =========================
async function agregarEstudiante(event) {

  event.preventDefault();

  const nombre = document.querySelector("#nombre").value;
  const dni = document.querySelector("#dni").value;
  const salon = document.querySelector("#salon").value;

  await fetch("http://localhost:3000/estudiantes", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      nombre,
      dni,
      salon
    })

  });

  cargarEstudiantes();

}

// =========================
// ELIMINAR
// =========================
function eliminarEstudiante(dni) {

  estudiantes = estudiantes.filter(est => est.dni !== dni);

  render();

}

// =========================
// FILTRO
// =========================
function cambiarFiltro(event) {

  filtro = event.target.value;

  render();

}

// =========================
// SELECCIONAR ESTUDIANTE
// =========================
function seleccionarEstudiante(nombre) {

  estudianteSeleccionado = nombre;

  render();

}

// =========================
// RENDER
// =========================
function render() {

  const estudiantesFiltrados = estudiantes.filter(est =>
    est.dni.includes(filtro)
  );

  app.innerHTML = `
    <div class="container">

      <h1>MONITOR DE AULA</h1>

      <p>
        Tiempo fuera de pestaña:
        ${tiempoFuera} segundos
      </p>

      <div class="card form-card">

        <h2>Agregar estudiante</h2>

        <form id="formulario">

          <input
            type="text"
            id="nombre"
            placeholder="Nombre"
            required
          />

          <input
            type="text"
            id="dni"
            placeholder="DNI"
            required
          />

          <input
            type="text"
            id="salon"
            placeholder="Salón"
            required
          />

          <button type="submit">
            Agregar
          </button>

        </form>

      </div>

      <div class="card form-card">

        <h2>Buscar estudiante</h2>

        <input
          type="text"
          id="buscar"
          placeholder="Buscar por DNI"
          value="${filtro}"
        />

      </div>

      <div class="card">

        <h2>Lista de estudiantes</h2>

        <table>

          <thead>
            <tr>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Salón</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>

            ${estudiantesFiltrados.map(est => `

              <tr>

                <td>

                  <button
                    class="ver"
                    data-nombre="${est.nombre}"
                  >
                    ${est.nombre}
                  </button>

                </td>

                <td>${est.dni}</td>

                <td>${est.salon}</td>

                <td>

                  <button
                    class="eliminar"
                    data-dni="${est.dni}"
                  >
                    Eliminar
                  </button>

                </td>

              </tr>

            `).join("")}

          </tbody>

        </table>

      </div>

      ${estudianteSeleccionado ? `

        <div class="card">

          <h2>
            Historial de ${estudianteSeleccionado}
          </h2>

          ${actividad
            .filter(act => act.estudiante === estudianteSeleccionado)
            .map(act => `

              <div class="card">

                <p>
                  <strong>URL:</strong>
                  ${act.url}
                </p>

                <p>
                  <strong>Título:</strong>
                  ${act.titulo}
                </p>

                <p>
                  <strong>Hora:</strong>
                  ${act.tiempo}
                </p>

              </div>

            `).join("")}

        </div>

      ` : ""}

    </div>
  `;

  // FORMULARIO
  document
    .querySelector("#formulario")
    .addEventListener("submit", agregarEstudiante);

  // BUSCADOR
  document
    .querySelector("#buscar")
    .addEventListener("input", cambiarFiltro);

  // ELIMINAR
  document
    .querySelectorAll(".eliminar")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        eliminarEstudiante(btn.dataset.dni);

      });

    });

  // VER HISTORIAL
  document
    .querySelectorAll(".ver")
    .forEach(btn => {

      btn.addEventListener("click", () => {

        seleccionarEstudiante(btn.dataset.nombre);

      });

    });

}

// =========================
// DETECTAR CAMBIO DE PESTAÑA
// =========================
document.addEventListener("visibilitychange", () => {

  if (document.hidden) {

    fueraDePestana = true;

    console.log("El alumno salió de la pestaña");

  } else {

    fueraDePestana = false;

    console.log("El alumno volvió");

    render();

  }

});

// =========================
// CONTADOR
// =========================
setInterval(() => {

  if (fueraDePestana) {

    tiempoFuera++;

    render();

  }

}, 1000);

// =========================
// INICIAR
// =========================
cargarEstudiantes();
cargarActividad();