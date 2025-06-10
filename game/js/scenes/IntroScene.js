// game/js/scenes/IntroScene.js
class IntroScene {
    constructor(game) {
        this.game = game; // Referencia al objeto Game principal
        this.background = assetLoader.getAsset('background_intro');
        this.overlay = assetLoader.getAsset('overlay_intro');

        this.player = new Player(-32, 200); // Empieza fuera de escena
        this.oldCouple = new OldCouple(300, 200, 340, 200);

        this.dialogue = [
            "JUGADOR: ¿Qué pasó con este lugar?",
            "JUGADOR: Hola, ¿saben qué ocurrió aquí?",
            "ABUELA: No lo sabemos... todo se siente tan vacío...",
            "ABUELO: Tengo recuerdos vagos del parque, pero todo es confuso...",
            "JUGADOR: ¿Ustedes viven aquí?",
            "ABUELA: Sí, pero esto no se siente igual, no somos capaces de recordar mucho.",
            "JUGADOR: Tranquilos, yo los ayudaré a recordar.",
            "¡Así empieza nuestra aventura!"
        ];
        this.dialogueStep = 0;
        this.isPlayerMoving = true;
        this.dialogueTimeout = null;

        this.lastUpdateTime = 0;
    }

    // Inicializa la escena
    init() {
        this.player.startMoving(); // El jugador comienza a moverse al iniciar la escena
        // Añadir el listener de click al canvas una vez que la escena esté activa
        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    // Limpia la escena (útil al cambiar de escena)
    destroy() {
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
    }

    // Maneja los clicks del ratón
    handleClick() {
        if (!this.isPlayerMoving) {
            this.advanceDialogue();
        }
    }

    // Actualiza la lógica de la escena
    update(deltaTime) {
        this.player.update(deltaTime);

        if (this.isPlayerMoving) {
            if (this.player.x >= 220) {
                this.player.stopMoving();
                this.isPlayerMoving = false;
                this.dialogueStep = 0; // Reinicia el paso de diálogo para la intro
                this.resetDialogueTimeout();
            }
        } else {
            // Lógica de diálogo
            if (this.dialogueStep < this.dialogue.length) {
                // Aquí el diálogo se maneja por el timeout o click
            } else {
                // Fin del diálogo, transicionar a la siguiente escena
                if (this.game.currentScene === this) { // Solo si esta es la escena activa
                    this.game.changeScene('level1'); // 'level1' será la clave para la siguiente escena
                }
            }
        }
    }

    // Dibuja la escena
    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.game.canvas.width, this.game.canvas.height);
        this.oldCouple.draw(ctx);
        this.player.draw(ctx);
        ctx.drawImage(this.overlay, 0, 0, this.game.canvas.width, this.game.canvas.height);

        if (!this.isPlayerMoving && this.dialogueStep < this.dialogue.length) {
            this.showDialogue(ctx, this.dialogue[this.dialogueStep]);
        }
    }

    showDialogue(ctx, text) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(10, 230, this.game.canvas.width - 20, 45); // Ajustar el ancho
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(text, 20, 255);
    }

    advanceDialogue() {
        if (this.dialogueStep < this.dialogue.length) { // Permite avanzar el último diálogo antes de terminar
            this.dialogueStep++;
            if (this.dialogueStep < this.dialogue.length) { // Si hay más diálogos, reinicia el timeout
                this.resetDialogueTimeout();
            } else { // Si es el último diálogo, se completó la introducción
                clearTimeout(this.dialogueTimeout);
                // La transición a la siguiente escena se maneja en el `update`
            }
        }
    }

    resetDialogueTimeout() {
        clearTimeout(this.dialogueTimeout);
        this.dialogueTimeout = setTimeout(() => {
            this.advanceDialogue();
        }, 5000); // Avanza automáticamente después de 5 segundos
    }
}