class IntroScene {
    constructor(game) {
        this.game = game;
        this.background = assetLoader.getAsset('background_intro');
        this.overlay = assetLoader.getAsset('overlay_intro');

        this.player = new Player(-32, 200);
        this.oldCouple = new OldCouple(300, 200, 340, 200); // Los abuelos ya están en su posición estática

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
        this.playerEntranceComplete = false; // Nuevo estado para controlar la entrada del jugador
        this.dialogueTimeout = null;

        this.lastUpdateTime = 0;
    }

    init() {
        this.player.startWalking('right'); // El jugador comienza a moverse a la derecha
        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    destroy() {
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
        if (this.playerEntranceComplete) { // Solo permite avanzar el diálogo una vez que el jugador ha entrado
            this.advanceDialogue();
        }
    }

    update(deltaTime) {
        this.player.update(deltaTime);
        this.oldCouple.update(deltaTime); // Asegúrate de actualizar los abuelos también

        if (!this.playerEntranceComplete) {
            if (this.player.x >= 220) {
                this.player.stopMoving(); // Cambia a standing
                this.playerEntranceComplete = true;
                this.dialogueStep = 0;
                this.resetDialogueTimeout();
            }
        } else {
            if (this.dialogueStep < this.dialogue.length) {
                // El diálogo se maneja por el timeout o click
            } else {
                // Fin del diálogo, transicionar a la siguiente escena
                if (this.game.currentScene === this) {
                    this.game.changeScene('level1');
                }
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.game.canvas.width, this.game.canvas.height);
        this.oldCouple.draw(ctx);
        this.player.draw(ctx);
        ctx.drawImage(this.overlay, 0, 0, this.game.canvas.width, this.game.canvas.height);

        if (this.playerEntranceComplete && this.dialogueStep < this.dialogue.length) {
            this.showDialogue(ctx, this.dialogue[this.dialogueStep]);
        }
    }

    showDialogue(ctx, text) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(10, 230, this.game.canvas.width - 20, 45);
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(text, 20, 255);
    }

    advanceDialogue() {
        if (this.dialogueStep < this.dialogue.length) {
            this.dialogueStep++;
            if (this.dialogueStep < this.dialogue.length) {
                this.resetDialogueTimeout();
            } else {
                clearTimeout(this.dialogueTimeout);
            }
        }
    }

    resetDialogueTimeout() {
        clearTimeout(this.dialogueTimeout);
        this.dialogueTimeout = setTimeout(() => {
            this.advanceDialogue();
        }, 5000);
    }
}