// game/js/scenes/Level2Scene.js

/**
 * Clase para la escena del Nivel 2: El Establo.
 */
class Level2Scene {
    constructor(game) {
        this.game = game;
        this.background = assetLoader.getAsset('background_barn'); // Usa el asset del fondo del establo
        this.barnElementsSheet = assetLoader.getAsset('barn_elements'); // Usa el asset de los elementos del establo
        this.horseSheet = assetLoader.getAsset('horse'); // Usa el asset del caballo

        this.player = new Player(-32, 200); 
        this.oldCouple = new OldCouple(-90, 200, -130, 200); 

        this.dialogue = [];
        this.dialogueStep = 0;
        this.dialogueTimeout = null;

        // --- Definición de animaciones para los elementos del establo ---
        // Basado en barn_elements.png
        // El caballo parece tener frames de 32x32px.
        // Los elementos pequeños (manzana, herradura, aceite) parecen de 32x32px.
        // Las carrozas parecen de 64x32px.
        
        const smallElementWidth = 32;
        const smallElementHeight = 32;
        const carriageWidth = 64; // Las carrozas son 2x1 en la grid de 32, así que 64px de ancho
        const carriageHeight = 32;

        this.barnElementAnimations = {
            'apple': { xOffset: 0, yOffset: 0, frameCount: 1 }, // Manzana (0,0)
            'horseshoe': { xOffset: 1, yOffset: 0, frameCount: 1 }, // Herradura (1,0)
            'oil_can': { xOffset: 2, yOffset: 0, frameCount: 1 }, // Lata de aceite (2,0)
            'dirty_carriage': { xOffset: 0, yOffset: 1, frameCount: 1 }, // Carroza sucia (0,1)
            'clean_carriage': { xOffset: 4, yOffset: 1, frameCount: 1 }, // Carroza limpia (4,1)
        };

        // Animaciones del caballo (horse.png)
        const horseSpriteWidth = 32; 
        const horseSpriteHeight = 32; 
        this.horseAnimations = {
            'blink': { xOffset: 0, yOffset: 0, frameCount: 2 } // Frame 0: normal, Frame 1: parpadeo
        };

        // --- Instancias de objetos interactivos ---
        // Posicionar el caballo (ajusta x, y, scale según tu background)
        this.horse = new InteractiveObject(
            400, 100, // Coordenadas de ejemplo
            this.horseSheet, 
            this.horseAnimations, 
            'blink', 
            3 // Escala del caballo para que sea más visible
        );
        this.horse.width = horseSpriteWidth;
        this.horse.height = horseSpriteHeight;
        this.horse.frameDelay = 500; // Velocidad de parpadeo

        // Carroza (inicialmente sucia)
        this.carriage = new InteractiveObject(
            150, 250, // Posición de la carroza
            this.barnElementsSheet, 
            this.barnElementAnimations, 
            'dirty_carriage', 
            2 // Escala de la carroza
        );
        this.carriage.width = carriageWidth; // Ancho real del sprite en la hoja
        this.carriage.height = carriageHeight; // Alto real del sprite en la hoja

        // Manzana (aparece en un punto específico)
        this.apple = new InteractiveObject(
            50, 280, // Posición de la manzana (ajusta para que se vea bien)
            this.barnElementsSheet, 
            this.barnElementAnimations, 
            'apple', 
            1.5
        );
        this.apple.width = smallElementWidth;
        this.apple.height = smallElementHeight;

        // Lata de aceite (aparece en un punto específico)
        this.oilCan = new InteractiveObject(
            100, 280, // Posición de la lata de aceite (ajusta para que se vea bien)
            this.barnElementsSheet, 
            this.barnElementAnimations, 
            'oil_can', 
            1.5
        );
        this.oilCan.width = smallElementWidth;
        this.oilCan.height = smallElementHeight;

        this.horseshoe = null; // La herradura aparece al final del nivel

        // --- Variables de estado del minijuego ---
        this.horseFed = false;
        this.carriageRepaired = false;
        this.activeItem = null; // 'apple' o 'oil_can' - para indicar qué objeto está seleccionado para usar

        // --- Sistema de preguntas ---
        this.quizQuestions = [
            {
                question: "ABUELA: ¿Qué alimento es bueno para un caballo, que también es dulce y crujiente?",
                options: ["Manzanas", "Pescado"],
                correctAnswerIndex: 0 
            },
            {
                question: "ABUELO: ¿Por qué es importante lubricar las ruedas de una carroza?",
                options: ["Para que chirríen más fuerte", "Para reducir la fricción y el desgaste"],
                correctAnswerIndex: 1 
            }
        ];
        this.currentQuestionIndex = 0;
        this.showQuiz = false;

        // --- Estados del nivel ---
        this.gameState = 'initial_entry'; 

        this.gameOverMessage = "ABUELOS: Los animales y la carroza aún necesitan más cuidado. ¡Inténtalo de nuevo!";
        this.gameOverPrompt = "Haz clic para reiniciar el nivel.";

        this.finalDialogueMessages = [
            "ABUELO: ¡Increíble! La herradura... ¡Ahora recuerdo! ¡Es el amuleto de la buena suerte de nuestra familia!",
            "ABUELA: ¡Y yo recuerdo las carreras en esta carroza reparada, con el dulce aroma de las manzanas que siempre llevábamos! ¡Tus acciones nos han devuelto la alegría y la memoria!"
        ];
    }

    init() {
        // Reiniciar posiciones de entrada para el Nivel 2
        this.player.x = -32; 
        this.player.y = 200;
        this.player.startWalking('right'); 

        this.oldCouple.grandmaX = -90; 
        this.oldCouple.grandmaY = 200;
        this.oldCouple.grandpaX = -130; 
        this.oldCouple.grandpaY = 200;
        this.oldCouple.startWalking('right'); 

        this.gameState = 'initial_entry';
        this.horseFed = false;
        this.carriageRepaired = false;
        this.activeItem = null;
        this.horseshoe = null; 
        this.carriage.setAnimation('dirty_carriage'); // Asegurarse de que la carroza esté sucia al inicio

        this.currentQuestionIndex = 0;
        this.showQuiz = false;

        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    destroy() {
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (this.gameState === 'game_over_screen') {
            this.game.changeScene('level2'); // Reiniciar Level2Scene
            return;
        }

        if (this.gameState === 'initial_dialogue' || 
            this.gameState === 'task_dialogue_1' || 
            this.gameState === 'task_dialogue_2' || 
            this.gameState === 'final_dialogue') {
            this.advanceDialogue();
        } else if (this.gameState === 'feed_horse') {
            this.handleFeedHorseClick(mouseX, mouseY);
        } else if (this.gameState === 'repair_carriage') {
            this.handleRepairCarriageClick(mouseX, mouseY);
        } else if (this.gameState === 'quiz_time') {
            this.handleQuizClick(mouseX, mouseY);
        } else if (this.gameState === 'level_complete') {
            if (this.horseshoe && this.horseshoe.isClicked(mouseX, mouseY)) {
                this.horseshoe = null; 
                this.gameState = 'final_dialogue';
                this.setDialogue(this.finalDialogueMessages);
                this.player.stopMoving();
                this.oldCouple.stopMoving();
            } else {
                this.setDialogue("JUGADOR: Debo hacer clic en la herradura para continuar.");
            }
        }
    }

    handleFeedHorseClick(mouseX, mouseY) {
        // Si la manzana fue clickeada para seleccionar
        if (this.apple.isClicked(mouseX, mouseY) && this.activeItem !== 'apple') {
            this.activeItem = 'apple';
            this.setDialogue("JUGADOR: He seleccionado la manzana. Ahora, ¿dónde la usaré?");
        } 
        // Si la manzana está seleccionada y se hace clic en el caballo
        else if (this.activeItem === 'apple' && this.horse.isClicked(mouseX, mouseY)) {
            if (!this.horseFed) {
                this.horseFed = true;
                this.activeItem = null; // Desactivar la manzana (se "usa")
                this.setDialogue("JUGADOR: ¡El caballo parece contento! Ha comido la manzana.");
            } else {
                this.setDialogue("JUGADOR: El caballo ya ha comido.");
            }
        } 
        else if (this.activeItem === 'apple' && !this.horse.isClicked(mouseX, mouseY)) {
            this.setDialogue("JUGADOR: Click en el caballo para darle la manzana.");
        }
        else if (!this.activeItem) { // Si no hay ítem activo y hace clic en nada relevante
             this.setDialogue("JUGADOR: Debo seleccionar la manzana para alimentar al caballo.");
        }
    }

    handleRepairCarriageClick(mouseX, mouseY) {
        // Si la lata de aceite fue clickeada para seleccionar
        if (this.oilCan.isClicked(mouseX, mouseY) && this.activeItem !== 'oil_can') {
            this.activeItem = 'oil_can';
            this.setDialogue("JUGADOR: He seleccionado el aceite. ¿Para qué servirá?");
        } 
        // Si el aceite está seleccionado y se hace clic en la carroza
        else if (this.activeItem === 'oil_can' && this.carriage.isClicked(mouseX, mouseY)) {
            if (!this.carriageRepaired) {
                this.carriageRepaired = true;
                this.activeItem = null; // Desactivar el aceite (se "usa")
                this.carriage.setAnimation('clean_carriage'); // Cambiar sprite a carroza limpia
                this.setDialogue("JUGADOR: La carroza está reluciente y sus ruedas no chirrían. ¡Lista para usar!");
            } else {
                this.setDialogue("JUGADOR: La carroza ya está reparada.");
            }
        }
        else if (this.activeItem === 'oil_can' && !this.carriage.isClicked(mouseX, mouseY)) {
            this.setDialogue("JUGADOR: Click en la carroza sucia para usar el aceite.");
        }
        else if (!this.activeItem) { // Si no hay ítem activo y hace clic en nada relevante
            this.setDialogue("JUGADOR: Debo seleccionar el aceite para reparar la carroza.");
        }
    }

    handleQuizClick(mouseX, mouseY) {
        if (!this.showQuiz) return;

        const currentQ = this.quizQuestions[this.currentQuestionIndex];
        if (!currentQ) return;

        const optionX = 20; 
        const optionWidth = this.game.canvas.width - 40; 
        const optionHeight = 30; 
        const option1Y = this.game.canvas.height - 80; 
        const option2Y = this.game.canvas.height - 40; 

        let selectedOptionIndex = -1;

        if (mouseX >= optionX && mouseX <= optionX + optionWidth) {
            if (mouseY >= option1Y && mouseY <= option1Y + optionHeight) {
                selectedOptionIndex = 0;
            } else if (mouseY >= option2Y && mouseY <= option2Y + optionHeight) {
                selectedOptionIndex = 1;
            }
        }

        if (selectedOptionIndex !== -1) {
            this.showQuiz = false; 

            if (selectedOptionIndex === currentQ.correctAnswerIndex) {
                this.currentQuestionIndex++; 
                if (this.currentQuestionIndex < this.quizQuestions.length) {
                    this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question); 
                } else {
                    this.gameState = 'level_complete';
                    this.setDialogue("ABUELOS: ¡Felicidades! ¡Has desbloqueado otro fragmento de nuestros recuerdos!");
                    // Posicionar la herradura en el centro
                    const horseshoeScale = 2; // Para que sea visible
                    const horseshoeWidth = this.barnElementAnimations.horseshoe.width || 32 * horseshoeScale; 
                    const horseshoeHeight = this.barnElementAnimations.horseshoe.height || 32 * horseshoeScale;
                    this.horseshoe = new InteractiveObject(
                        (this.game.canvas.width / 2) - (horseshoeWidth / 2),
                        (this.game.canvas.height / 2) - (horseshoeHeight / 2),
                        this.barnElementsSheet, 
                        this.barnElementAnimations, 
                        'horseshoe', 
                        horseshoeScale
                    );
                    this.horseshoe.width = smallElementWidth; // Asegurar el tamaño correcto del sprite
                    this.horseshoe.height = smallElementHeight;
                }
            } else {
                this.gameState = 'game_over_screen';
            }
        }
    }

    update(deltaTime) {
        if (this.gameState === 'game_over_screen') {
            return; 
        }

        // Lógica de entrada inicial
        if (this.gameState === 'initial_entry') {
            this.player.update(deltaTime);
            this.oldCouple.update(deltaTime);

            const movement = 2 * deltaTime / 16; 
            this.player.x += movement;
            this.oldCouple.grandmaX += movement;
            this.oldCouple.grandpaX += movement;

            if (this.player.x >= 100) { 
                this.player.stopMoving();
                const stopXGrandma = this.game.canvas.width - 50; 
                const stopXGrandpa = stopXGrandma - 40; 
                this.oldCouple.stopMoving();
                this.oldCouple.grandmaX = stopXGrandma; 
                this.oldCouple.grandpaX = stopXGrandpa; 

                this.gameState = 'initial_dialogue';
                this.setDialogue("ABUELO: ¡Bienvenido al establo! Aquí tenemos otra tarea importante para ti.");
            }
        } else if (this.gameState === 'final_dialogue') {
            this.player.update(deltaTime);
            this.oldCouple.update(deltaTime);

            // Si el diálogo final ha terminado, los personajes empiezan a salir
            if (this.dialogueStep >= this.dialogue.length) {
                this.player.startWalking('right');
                this.oldCouple.startWalking('right');

                const movement = 2 * deltaTime / 16; 
                this.player.x += movement;
                this.oldCouple.grandmaX += movement;
                this.oldCouple.grandpaX += movement;

                // Cuando todos los personajes han salido de la pantalla
                if (this.player.x > this.game.canvas.width + this.player.width * this.player.scale) {
                    // Aquí iría la transición al Nivel 3, si lo tuvieras
                    // Por ahora, podrías volver a Intro o al Nivel 1 para probar
                    this.game.changeScene('intro'); // Ejemplo: volver a Intro
                }
            }
        }

        // Actualizar animaciones de personajes y objetos
        this.player.update(deltaTime); 
        this.oldCouple.update(deltaTime);
        this.horse.update(deltaTime); 
        this.carriage.update(deltaTime);
        this.apple.update(deltaTime);
        this.oilCan.update(deltaTime);
        if (this.horseshoe) {
            this.horseshoe.update(deltaTime);
        }

        // Lógica de progresión del nivel
        if (this.gameState === 'initial_dialogue' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_dialogue_1';
            this.setDialogue("ABUELA: Primero, el caballo parece tener hambre. ¿Puedes alimentarlo? Busca en los alrededores.");
        } else if (this.gameState === 'task_dialogue_1' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'feed_horse';
            this.setDialogue("JUGADOR: Debo encontrar algo para alimentar al caballo. ¡Allí hay una manzana!");
        } else if (this.gameState === 'feed_horse' && this.horseFed && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_dialogue_2';
            this.setDialogue("ABUELO: Buen trabajo. Ahora, nuestra vieja carroza necesita un poco de mantenimiento. ¿Puedes repararla?");
        } else if (this.gameState === 'task_dialogue_2' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'repair_carriage';
            this.setDialogue("JUGADOR: La carroza parece un poco descuidada. ¡Una lata de aceite podría ayudar!");
        } else if (this.gameState === 'repair_carriage' && this.carriageRepaired && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'quiz_time';
            if (this.currentQuestionIndex === 0 && !this.showQuiz) {
                this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question);
            }
            this.showQuiz = true;
        } 
        // Transición de 'quiz_time' a 'level_complete' o 'game_over_screen' se maneja en handleQuizClick.
    }

    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.game.canvas.width, this.game.canvas.height);

        // Dibujar elementos solo cuando sean relevantes o ya estén interactuados
        if (this.gameState === 'feed_horse' || this.horseFed || this.gameState === 'task_dialogue_2' || this.gameState === 'repair_carriage' || this.gameState === 'quiz_time' || this.gameState === 'level_complete' || this.gameState === 'final_dialogue') {
            this.apple.draw(ctx); 
        }
        if (this.gameState === 'repair_carriage' || this.carriageRepaired || this.gameState === 'quiz_time' || this.gameState === 'level_complete' || this.gameState === 'final_dialogue') {
            this.oilCan.draw(ctx); 
        }
        
        this.carriage.draw(ctx);
        this.horse.draw(ctx);

        if (this.horseshoe) { // La herradura solo se dibuja si el nivel está completo
            this.horseshoe.draw(ctx);
        }
        
        this.oldCouple.draw(ctx); 
        this.player.draw(ctx); 

        // Mostrar el diálogo (si hay uno activo y no es quiz_time o game_over)
        if (this.dialogueStep < this.dialogue.length && this.gameState !== 'quiz_time' && this.gameState !== 'game_over_screen') {
            this.showDialogue(ctx, this.dialogue[this.dialogueStep]);
        }
        
        // Mostrar el quiz si es el momento
        if (this.showQuiz && this.gameState === 'quiz_time') {
            this.drawQuiz(ctx);
        }

        // Mostrar la pantalla de Game Over si el estado lo indica
        if (this.gameState === 'game_over_screen') {
            this.drawGameOverScreen(ctx);
        }
    }

    // --- Métodos de Diálogo y Utilidades (Copia estas de Level1Scene.js) ---
    showDialogue(ctx, text) {
        const boxX = 10;
        const boxY = this.game.canvas.height - 70;
        const boxWidth = this.game.canvas.width - 20;
        const boxHeight = 60;
        const padding = 10;
        const lineHeight = 18; 

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; 
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight); 

        ctx.fillStyle = 'white';
        ctx.font = '14px Arial'; 

        this.wrapText(ctx, text, boxX + padding, boxY + padding + lineHeight, boxWidth - (padding * 2), lineHeight);
    }

    drawQuiz(ctx) {
        const currentQ = this.quizQuestions[this.currentQuestionIndex];
        if (!currentQ) return; 

        const boxX = 10;
        const boxY = this.game.canvas.height - 130;
        const boxWidth = this.game.canvas.width - 20;
        const boxHeight = 120;
        const padding = 10;
        const lineHeight = 20; 

        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial'; 
        
        this.wrapText(ctx, currentQ.question, boxX + padding, boxY + padding + lineHeight, boxWidth - (padding * 2), lineHeight);

        ctx.font = '14px Arial'; 
        ctx.fillStyle = 'rgba(50, 50, 150, 0.8)'; 
        ctx.fillRect(20, this.game.canvas.height - 80, this.game.canvas.width - 40, 30);
        ctx.fillStyle = 'white';
        ctx.fillText(`1. ${currentQ.options[0]}`, 30, this.game.canvas.height - 60);

        ctx.fillStyle = 'rgba(50, 50, 150, 0.8)'; 
        ctx.fillRect(20, this.game.canvas.height - 40, this.game.canvas.width - 40, 30);
        ctx.fillStyle = 'white';
        ctx.fillText(`2. ${currentQ.options[1]}`, 30, this.game.canvas.height - 20);
    }

    drawGameOverScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("¡Oh no!", this.game.canvas.width / 2, this.game.canvas.height / 2 - 50);

        ctx.font = '18px Arial';
        this.wrapText(ctx, this.gameOverMessage, 
                      this.game.canvas.width / 2 - ((this.game.canvas.width - 100) / 2), 
                      this.game.canvas.height / 2 - 10, 
                      this.game.canvas.width - 100, 
                      25, 
                      'center'); 

        ctx.font = '16px Arial';
        ctx.fillText(this.gameOverPrompt, this.game.canvas.width / 2, this.game.canvas.height / 2 + 60);
        ctx.textAlign = 'left'; 
    }

    setDialogue(text) {
        this.dialogue = Array.isArray(text) ? text : [text]; 
        this.dialogueStep = 0;
        this.resetDialogueTimeout();
    }

    advanceDialogue() {
        if (this.dialogueStep < this.dialogue.length) {
            this.dialogueStep++;
            if (this.dialogueStep < this.dialogue.length) {
                this.resetDialogueTimeout(); 
            } else {
                clearTimeout(this.dialogueTimeout); 
                if (this.gameState === 'quiz_time' && this.currentQuestionIndex < this.quizQuestions.length) {
                    this.showQuiz = true;
                }
                if (this.gameState === 'final_dialogue' && this.dialogueStep >= this.dialogue.length) {
                    this.player.startWalking('right');
                    this.oldCouple.startWalking('right');
                }
            }
        }
    }

    resetDialogueTimeout() {
        clearTimeout(this.dialogueTimeout);
        this.dialogueTimeout = setTimeout(() => {
            this.advanceDialogue();
        }, 5000); 
    }
    
    wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        const originalTextAlign = ctx.textAlign;
        ctx.textAlign = align;

        let lineX = x;
        if (align === 'center') {
            lineX = x + maxWidth / 2; 
        } else if (align === 'right') {
            lineX = x + maxWidth; 
        }

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line.trim(), lineX, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), lineX, currentY);
        ctx.textAlign = originalTextAlign;
    }
}