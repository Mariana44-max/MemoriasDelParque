// Cambiar entre secciones
function showSection(id) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Mostrar u ocultar contenido de cada nivel al hacer clic
function toggleLevel(element) {
    document.querySelectorAll('.level').forEach(level => {
        if (level !== element) level.classList.remove('active');
    });
    element.classList.toggle('active');
}


let players = [];

function addPlayer() {
    const name = document.getElementById('playerName').value.trim();
    const time = parseFloat(document.getElementById('playerTime').value);

    if (name === '' || isNaN(time) || name == null || time == null)  {
        alert('Por favor ingresa un nombre y un tiempo válido.');
        return;
    }

    players.push({ name, time });
    players.sort((a, b) => a.time - b.time); // Orden por tiempo menor

    showTable();
    cleanForm();
}

function showTable() {
    const tbody = document.querySelector('#ranking tbody');
    tbody.innerHTML = '';

    players.forEach((player, index) => {
        const line = document.createElement('tr');
        line.innerHTML = `
            <td>${index + 1}</td>
            <td>${player.name}</td>
            <td>${player.time}</td>
        `;
        tbody.appendChild(line);
    });
}

function cleanForm() {
    document.getElementById('playerName').value = '';
    document.getElementById('playerTime').value = '';
}