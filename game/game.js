// game.js

// Obtener el canvas y el contexto de dibujo
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Cargar una imagen de prueba (puede ser la primera del sprite walk)
const testImage = new Image();
testImage.src = '../sprites/player/walk1.png'; // Usa la ruta real que tengas

// Variables para el bucle
let lastFrameTime = 0;
const fps = 12;
const frameDuration = 1000 / fps;

// Función principal del juego (se llama varias veces por segundo)
function gameLoop(timestamp) {
    if (timestamp - lastFrameTime >= frameDuration) {
        update(); // Actualizar lógica
        draw();   // Dibujar en pantalla
        lastFrameTime = timestamp;
    }

    requestAnimationFrame(gameLoop);
}

// Lógica del juego
function update() {
    // Aquí luego moveremos al jugador, enemigos, etc.
}

// Dibujar en pantalla
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar canvas

    // Dibujar imagen de prueba (solo para verificar que todo funciona)
    ctx.drawImage(testImage, 100, 100);
}

// Esperar que cargue la imagen antes de iniciar
testImage.onload = () => {
    requestAnimationFrame(gameLoop);
};