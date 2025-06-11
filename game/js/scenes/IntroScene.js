// game/js/scenes/IntroScene.js
class IntroScene {
    constructor(game) {
        this.game = game;
        this.background = assetLoader.getAsset('background_intro');
        this.overlay = assetLoader.getAsset('overlay_intro');

        this.player = new Player(-32, 200); // El jugador empieza fuera de pantalla a la izquierda
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
        this.playerEntranceComplete = false;
        this.dialogueEnded = false; // Estado para controlar el fin del diálogo
        this.transitioningToLevel1 = false; // Estado para la transición de salida
        this.transitionSpeed = 1; // Velocidad a la que se mueven fuera de pantalla (ajustable)

        this.lastUpdateTime = 0; // Para el deltaTime
    }

    init() {
        this.player.startWalking('right'); // El jugador comienza a moverse a la derecha para entrar
        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    destroy() {
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick() {
        // Solo permite avanzar el diálogo una vez que el jugador ha entrado
        if (this.playerEntranceComplete && !this.dialogueEnded) {
            this.advanceDialogue();
        }
    }

    update(deltaTime) {
        this.player.update(deltaTime);
        this.oldCouple.update(deltaTime); // Actualizar los abuelos

        // Lógica de entrada del jugador y abuelos
        if (!this.playerEntranceComplete) {
            // Mover jugador y abuelos hasta que el jugador llegue a su posición inicial
            if (this.player.x < 220) { // Posición X donde el jugador se detiene para el diálogo
                // El movimiento ya se maneja en player.update y oldCouple.update,
                // solo necesitamos que sigan moviéndose
            } else {
                this.player.stopMoving(); // Jugador se detiene
                this.playerEntranceComplete = true;
                this.dialogueStep = 0; // Iniciar diálogo
                this.resetDialogueTimeout();
            }
        } else if (!this.dialogueEnded) { // Mientras el diálogo no haya terminado
            if (this.dialogueStep >= this.dialogue.length) {
                this.dialogueEnded = true; // El diálogo ha terminado
                this.player.startWalking('right'); // Jugador empieza a caminar hacia la derecha
                this.oldCouple.startWalking('right'); // Abuelos también
                this.transitioningToLevel1 = true; // Iniciar fase de transición
            }
        } else if (this.transitioningToLevel1) {
            // Mueve a los personajes fuera de la pantalla por la derecha
            // Usamos el deltaTime para una velocidad constante independientemente de los FPS
            const movement = this.transitionSpeed * deltaTime / 16; 
            this.player.x += movement;
            this.oldCouple.grandmaX += movement;
            this.oldCouple.grandpaX += movement;

            // La condición para cambiar de escena: cuando el jugador desaparece completamente
            if (this.player.x > this.game.canvas.width + this.player.width) {
                this.game.changeScene('level1');
                this.transitioningToLevel1 = false; // Detener la bandera de transición
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.game.canvas.width, this.game.canvas.height);
        this.oldCouple.draw(ctx); // Dibujar abuelos
        this.player.draw(ctx); // Dibujar jugador
        ctx.drawImage(this.overlay, 0, 0, this.game.canvas.width, this.game.canvas.height);

        // Solo mostrar diálogo si la entrada del jugador está completa y el diálogo no ha terminado
        if (this.playerEntranceComplete && !this.dialogueEnded) {
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
                clearTimeout(this.dialogueTimeout); // Borrar el timeout si el diálogo finaliza
            }
        }
    }

    resetDialogueTimeout() {
        clearTimeout(this.dialogueTimeout);
        this.dialogueTimeout = setTimeout(() => {
            this.advanceDialogue();
        }, 5000); // Avanzar cada 5 segundos automáticamente
    }
}