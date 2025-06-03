// Obtener el canvas y su contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Cargar el fondo de introducción
const background = new Image();
background.src = 'backgrounds/intro.png';

// Cargar los sprites
const playerSprite = new Image();
playerSprite.src = 'sprites/player/walk1.png';

const grandmaSprite = new Image();
grandmaSprite.src = 'sprites/grandma/walk1.png';

const grandpaSprite = new Image();
grandpaSprite.src = 'sprites/grandpa/walk1.png';

// Cargar los elementos overlay
const overlayImage = new Image();
overlayImage.src = 'extra-elements/intro.png';

// Posiciones iniciales
let playerX = -32; // empieza fuera del escenario a la izquierda
let playerY = 200;

const grandmaX = 300;
const grandmaY = 200;

const grandpaX = 340;
const grandpaY = 200;

let frame = 0;
let dialogueStep = 0;
let isPlayerMoving = true;
let dialogueTimeout;


// Textos de diálogo (en español para el jugador)
const dialogue = [
    "JUGADOR: ¿Qué pasó con este lugar?",
    "JUGADOR: Hola, ¿saben que ocurrió aquí?",
    "ABUELA: No lo sabemos... todo se siente tan vacío...",
    "ABUELO: Tengo recuerdos vagos del parque, pero todo es confuso...",
    "JUGADOR: ¿ustedes viven aquí?",
    "ABUELA: Sí, pero esto no se siente igual, no somos capaces de recordar mucho.",
    "JUGADOR: Tranquilos, yo los ayudare a recordar.",
    "¡Así empieza nuestra aventura!"
];

// Función para dibujar el fondo y los personajes
function drawScene() {
    // Dibujar fondo
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Dibujar jugador
    ctx.drawImage(playerSprite, frame * 32, 0, 32, 32, playerX, playerY, 48, 48);

    // Dibujar abuelos
    ctx.drawImage(grandmaSprite, 0, 0, 32, 32, grandmaX, grandmaY, 48, 48);
    ctx.drawImage(grandpaSprite, 0, 0, 32, 32, grandpaX, grandpaY, 48, 48);

    // Dibujar overlay
    ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
}

// Función para mostrar diálogo
function showDialogue(text) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(10, 230, 492, 45);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.fillText(text, 20, 255);
}

// FPS

let lastFrameTime = 0;
const frameInterval = 1000 / 12; // ~166.67 ms por frame (6 FPS)

function gameLoop(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawScene();

    if (isPlayerMoving) {
        playerX += 1;

        // Solo actualiza el frame si ha pasado el intervalo adecuado
        if (timestamp - lastFrameTime >= frameInterval) {
            frame = (frame + 1) % 3; // Suponiendo 4 frames por animación
            lastFrameTime = timestamp;
        }

        if (playerX >= 220) {   
            setTimeout(() => {
                isPlayerMoving = false;
                dialogueStep = 0;
                resetDialogueTimeout();
            }, 500);
        }
    } else {
        if (dialogueStep < dialogue.length) {
            showDialogue(dialogue[dialogueStep]);
        }
    }

    requestAnimationFrame(gameLoop);
}

function advanceDialogue() {
    if (dialogueStep < dialogue.length - 1) {
        dialogueStep++;
        resetDialogueTimeout();
    } else if (dialogueStep === dialogue.length - 1) {
        // Final del diálogo, puedes iniciar el siguiente nivel aquí
        clearTimeout(dialogueTimeout);
        alert("¡Empieza el nivel del cafetal!");
    }
}

function resetDialogueTimeout() {
    clearTimeout(dialogueTimeout);
    dialogueTimeout = setTimeout(() => {
        advanceDialogue();
    }, 5000); // Avanza automáticamente después de 5 segundos
}

canvas.addEventListener('click', () => {
    if (!isPlayerMoving) {
        advanceDialogue();
    }
});


// Iniciar cuando se cargue todo
window.onload = () => {
    gameLoop();
};
