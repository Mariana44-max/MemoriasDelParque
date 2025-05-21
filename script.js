// Cambiar entre secciones
function mostrarSeccion(id) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(sec => sec.classList.remove('activa'));
    document.getElementById(id).classList.add('activa');
}

// Mostrar u ocultar contenido de cada nivel al hacer clic
function toggleNivel(elemento) {
    elemento.classList.toggle('activo');
}

let jugadores = [];

function agregarJugador() {
    const nombre = document.getElementById('nombreJugador').value.trim();
    const tiempo = parseFloat(document.getElementById('tiempoJugador').value);

    if (nombre === '' || isNaN(tiempo)) {
        alert('Por favor ingresa un nombre y un tiempo válido.');
        return;
    }

    jugadores.push({ nombre, tiempo });
    jugadores.sort((a, b) => a.tiempo - b.tiempo); // Orden por tiempo menor

    mostrarTabla();
    limpiarFormulario();
}

function mostrarTabla() {
    const tbody = document.querySelector('#ranking tbody');
    tbody.innerHTML = '';

    jugadores.forEach((jugador, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${index + 1}</td>
            <td>${jugador.nombre}</td>
            <td>${jugador.tiempo}</td>
        `;
        tbody.appendChild(fila);
    });
}

function limpiarFormulario() {
    document.getElementById('nombreJugador').value = '';
    document.getElementById('tiempoJugador').value = '';
}