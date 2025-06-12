class Level2Scene {
    constructor(game) {
        this.game = game;
        this.background = assetLoader.getAsset('background_barn'); // Usamos el nuevo fondo del establo
        this.barnElementsSheet = assetLoader.getAsset('barn_elements_sheet'); // Nueva hoja de elementos
        this.horseHeadSheet = assetLoader.getAsset('horse_head_sheet'); // Hoja de la cabeza del caballo

        // Crea instancias de tus personajes aquí, si son necesarios
        // Por ejemplo, el jugador y los abuelos si aparecen en este nivel
        this.player = new Player(50, 200); // Ajusta la posición inicial
        this.oldCouple = new OldCouple(400, 200, 440, 200); // Ajusta la posición inicial

         this.barnElementAnimations = {
            'apple': { xOffset: 0, yOffset: 0, frameCount: 1 },         // Fila 1, Columna 0
            'golden_horseshoe': { xOffset: 1, yOffset: 0, frameCount: 1 }, // Fila 1, Columna 1
            'oil_can': { xOffset: 2, yOffset: 0, frameCount: 1 },       // Fila 1, Columna 2
            'carriage_clean': { xOffset: 0, yOffset: 1, frameCount: 1 }, // Fila 2, Columna 0
            'carriage_dirty': { xOffset: 1, yOffset: 1, frameCount: 1 }   // Fila 2, Columna 1
        };

        // Animaciones para el caballo (solo parpadeo)
        // La hoja horse.png tiene 2 frames en una sola fila (0,0 y 1,0)
        this.horseAnimations = {
            'idle': { xOffset: 0, yOffset: 0, frameCount: 1 },   // Frame normal
            'blink': { xOffset: 1, yOffset: 0, frameCount: 1 }  // Frame parpadeo
        };

        // Instancias de objetos interactivos
        this.apple = null; // Se inicializará en init o cuando sea necesario
        this.carriage = null;
        this.oilCan = null;
        this.goldenHorseshoe = null; // Aparece al final

        // Instancia del caballo (usaremos InteractiveObject con un manejo especial para el parpadeo)
        // Ajusta las coordenadas (x,y) según dónde quieras que esté el caballo en el fondo barn.png
        this.horse = new InteractiveObject(269, 83, this.horseHeadSheet, this.horseAnimations, 'idle', 2.5); 
        this.horseBlinkTimer = 0;
        this.horseBlinkDelay = 8000; // Parpadea cada 8 segundos
        this.isHorseBlinking = false;
        this.blinkDuration = 100; // Duración del parpadeo en milisegundos

        // Variables para el diálogo
        this.dialogue = [];
        this.dialogueStep = 0;
        this.dialogueTimeout = null;

        // Estado del juego para este nivel
        this.gameState = 'initial_dialogue'; // Puedes empezar con un diálogo inicial

        // Aquí crearás las instancias de InteractiveObject para los elementos del establo
        // Ejemplo:
        // this.feedBucket = new InteractiveObject(100, 150, this.barnElementsSheet, this.barnElementAnimations, 'feed_bucket', 2);
        // this.horse = new InteractiveObject(300, 100, this.horseHeadSheet, { 'idle': { xOffset: 0, yOffset: 0, frameCount: 2 } }, 'idle', 3);
        // NOTA: Para el caballo que parpadea, la clase InteractiveObject podría necesitar un frameDelay o un tipo de animación específico.
        // Si el caballo es solo una imagen estática o solo parpadea, podría ser manejado de forma diferente o con una subclase.
    }

    init() {
        console.log("Inicializando Level2Scene");
        this.player.x = 50; 
        this.player.y = 200;
        this.player.stopMoving(); 

        this.oldCouple.grandmaX = 400; 
        this.oldCouple.grandmaY = 200;
        this.oldCouple.grandpaX = 440; 
        this.oldCouple.grandpaY = 200;
        this.oldCouple.stopMoving();

        this.gameState = 'initial_dialogue';
        this.setDialogue([
            "ABUELO: ¡Llegamos al establo! Aquí pasaba mucho tiempo con los animales.",
            "ABUELA: Sí, aquí es donde aprendimos a cuidar a los caballos.",
            "JUGADOR: Parece que hay cosas que hacer aquí para recordar más..."
        ]);

        // Estados específicos de las tareas del Nivel 2
        this.appleFedToHorse = false;
        this.carriageClean = false;
        this.oilApplied = false;

        // Inicializar objetos interactivos para el nivel 2
        // Ajusta las coordenadas (x,y) de estos objetos según tu background del establo.
        this.apple = new InteractiveObject(100, 230, this.barnElementsSheet, this.barnElementAnimations, 'apple', 1.5);
        this.carriage = new InteractiveObject(this.game.canvas.width / 3, 160, this.barnElementsSheet, this.barnElementAnimations, 'carriage_dirty', 3.7); // La carroza empieza sucia
        this.oilCan = new InteractiveObject(300, 220, this.barnElementsSheet, this.barnElementAnimations, 'oil_can', 1.5);
        this.goldenHorseshoe = null; // Se inicializa al final

        // Reiniciar el estado del caballo para el parpadeo
        this.horse.setAnimation('idle');
        this.horseBlinkTimer = 0;
        this.isHorseBlinking = false;

        // Quiz para el Nivel 2
        this.quizQuestions = [
            {
                question: "ABUELA: ¿Como se llama el elemento con el que guiamos al caballo?",
                options: ["A) Rienda", "B) Montura"],
                correctAnswerIndex: 0 
            },
            {
                question: "ABUELO: ¿Que comida no le puedo dar a un caballo?",
                options: ["A) Para que brille", "B) Carne"],
                correctAnswerIndex: 1 
            },
            {
                question: "ABUELA: ¿Qué se le echa a las ruedas de una carroza para que giren suavemente?",
                options: ["A) Grasa", "B) Aceite"],
                correctAnswerIndex: 1 
            }
        ];
        this.currentQuestionIndex = 0;
        this.showQuiz = false;
        this.quizAttempted = false; // Para saber si ya se intentó el quiz

        this.amuletPiece2 = null; // La herradura dorada

        // Añadir el listener para el clic
        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    destroy() {
        // Limpiar recursos al salir de la escena (ej: quitar event listeners)
        console.log("Destruyendo Level2Scene");
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (this.gameState === 'game_over_screen') {
            this.game.changeScene('level2'); // Reiniciar Level2Scene si hay game over
            return;
        }

        // Avance de diálogo general (siempre que no esté en quiz o game over)
        if (this.dialogueStep < this.dialogue.length && this.gameState !== 'quiz_time') {
            this.advanceDialogue();
            return; // Importante para que no se procesen clics de objetos mientras el diálogo avanza
        }

        // Lógica de interacción según el estado del juego
        if (this.gameState === 'task_feed_horse_apple') {
            if (this.apple && this.apple.isClicked(mouseX, mouseY)) {
                this.apple.x = -100; // Mueve la manzana fuera de la vista
                this.setDialogue("JUGADOR: ¡Aquí tienes, amiguito! Parece que le gusta.");
                this.appleFedToHorse = true;
                // Opcional: una animación corta del caballo comiendo o parpadeando extra.
            } else {
                this.setDialogue("JUGADOR: Debo darle la manzana al caballo. Haz clic en la manzana.");
            }
        } else if (this.gameState === 'task_clean_carriage') {
            if (this.carriage && this.carriage.isClicked(mouseX, mouseY) && !this.carriageClean) {
                this.carriage.setAnimation('carriage_clean'); // Cambia al sprite de carroza limpia
                this.carriageClean = true;
                this.setDialogue("JUGADOR: ¡La carroza está limpia! Brillando como nueva.");
            } else if (this.carriageClean) {
                this.setDialogue("JUGADOR: La carroza ya está limpia.");
            } else {
                this.setDialogue("JUGADOR: Debo hacer clic en la carroza sucia para limpiarla.");
            }
        } else if (this.gameState === 'task_oil_wheels') {
            if (this.oilCan && this.oilCan.isClicked(mouseX, mouseY) && !this.oilApplied) {
                this.oilCan.x = -100; // Mueve el tarro de aceite fuera de la vista
                this.oilApplied = true;
                this.setDialogue("JUGADOR: ¡Ruedas lubricadas! Ahora la carroza deslizará suave.");
                // Opcional: una pequeña animación o sonido de lubricación.
            } else if (this.oilApplied) {
                this.setDialogue("JUGADOR: El aceite ya fue aplicado.");
            } else {
                this.setDialogue("JUGADOR: Debo usar el tarro de aceite para las ruedas.");
            }
        } else if (this.gameState === 'quiz_time') {
            this.handleQuizClick(mouseX, mouseY); // Llama al método del quiz
        } else if (this.gameState === 'level_complete') {
            if (this.goldenHorseshoe && this.goldenHorseshoe.isClicked(mouseX, mouseY)) {
                this.goldenHorseshoe = null; // "Recoger" la herradura
                this.gameState = 'final_dialogue'; // Iniciar el diálogo final
                this.setDialogue([
                    "ABUELA: ¡Esta herradura dorada era un símbolo de buena suerte en nuestra familia!",
                    "ABUELO: ¡Gracias a ti, hemos recuperado otro valioso recuerdo de este lugar!"
                ]);
                this.player.stopMoving();
                this.oldCouple.stopMoving();
            } else {
                this.setDialogue("JUGADOR: Debo hacer clic en la herradura dorada para continuar.");
            }
        }

        // Lógica para avanzar el diálogo
        if (this.dialogueStep < this.dialogue.length && this.gameState !== 'quiz_time') {
            this.advanceDialogue();
        } 
        // else if (this.gameState === 'collect_items_barn') {
        //     // Lógica de interacción para los elementos del establo
        // }
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
            this.showQuiz = false; // Oculta el quiz inmediatamente después de la selección

            if (selectedOptionIndex === currentQ.correctAnswerIndex) {
                this.currentQuestionIndex++; // Avanza a la siguiente pregunta
                if (this.currentQuestionIndex < this.quizQuestions.length) {
                    this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question); // Muestra la siguiente pregunta
                } else {
                    // Todas las preguntas respondidas correctamente
                    this.gameState = 'level_complete';
                    this.setDialogue("ABUELOS: ¡Lo lograste! ¡Otro recuerdo desbloqueado! ¡Busca la herradura dorada!");
                    
                    // Posicionar la herradura dorada (amuletPiece2) en el centro
                    const horseshoeScale = 2; // Para que sea visible
                    const horseshoeWidth = 32 * horseshoeScale; 
                    const horseshoeHeight = 32 * horseshoeScale;
                    this.goldenHorseshoe = new InteractiveObject(
                        (this.game.canvas.width / 2) - (horseshoelWidth / 2),
                        (this.game.canvas.height / 2) - (horseshoeHeight / 2),
                        this.barnElementsSheet, // Usamos la sheet de elementos del establo
                        this.barnElementAnimations, 
                        'golden_horseshoe', // Usamos la animación de la herradura dorada
                        horseshoeScale
                    );
                }
            } else {
                // Respuesta incorrecta
                this.gameState = 'game_over_screen';
                this.setDialogue("ABUELOS: No has recordado bien. ¡Inténtalo de nuevo!");
            }
        }
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

    update(deltaTime) {
        // Actualizar personajes
        this.player.update(deltaTime);
        this.oldCouple.update(deltaTime);

       // Lógica de progresión del nivel
        if (this.gameState === 'initial_dialogue' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_feed_horse_apple';
            this.setDialogue("ABUELO: Este caballo solía ser mi favorito. ¿Podrías darle esta manzana para que se sienta mejor?");
            // Si quieres que la manzana aparezca solo ahora
            // this.apple = new InteractiveObject(100, 200, this.barnElementsSheet, this.barnElementAnimations, 'apple', 1.5);
        } 
        
        // Lógica de parpadeo del caballo
        if (this.horse) {
            this.horseBlinkTimer += deltaTime;
            if (!this.isHorseBlinking && this.horseBlinkTimer >= this.horseBlinkDelay) {
                this.horse.setAnimation('blink');
                this.isHorseBlinking = true;
                this.horseBlinkTimer = 0; // Reinicia el timer para la duración del parpadeo
            } else if (this.isHorseBlinking && this.horseBlinkTimer >= this.blinkDuration) {
                this.horse.setAnimation('idle');
                this.isHorseBlinking = false;
                this.horseBlinkTimer = 0; // Reinicia el timer para el próximo parpadeo
            }
        }

        // Transiciones entre tareas
        if (this.gameState === 'task_feed_horse_apple' && this.appleFedToHorse && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_clean_carriage';
            this.setDialogue("ABUELA: ¡Qué bien se ve el caballo! Ahora recuerdo... Solíamos pasear en la carroza, pero está muy sucia. ¿Podrías limpiarla?");
        } else if (this.gameState === 'task_clean_carriage' && this.carriageClean && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_oil_wheels';
            this.setDialogue("ABUELO: ¡Perfecto! La carroza ya se ve mucho mejor. Pero para que ruede bien, necesita aceite en las ruedas. ¡Usa el tarro de aceite!");
        } else if (this.gameState === 'task_oil_wheels' && this.oilApplied && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'quiz_time';
            if (this.currentQuestionIndex === 0 && !this.showQuiz && !this.quizAttempted) { // Solo muestra el primer quiz si no ha sido intentado
                this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question);
                this.showQuiz = true;
                this.quizAttempted = true; // Marca que el quiz ha comenzado
            }
            // La transición de 'quiz_time' a 'level_complete' se manejará en `handleQuizClick`.
        } else if (this.gameState === 'level_complete' && this.dialogueStep >= this.dialogue.length) {
            // Lógica para que los personajes salgan y la transición al siguiente nivel
            this.player.startWalking('right');
            this.oldCouple.startWalking('right');

            const movement = 2 * deltaTime / 16; 
            this.player.x += movement;
            this.oldCouple.grandmaX += movement;
            this.oldCouple.grandpaX += movement;

            if (this.player.x > this.game.canvas.width + this.player.width * this.player.scale) {
                //this.game.changeScene('level3'); // ¡Cambia a Level 3 cuando lo tengas!
                this.game.changeScene('intro'); // Por ahora, vuelve a la intro o a Level1 si quieres repetir
            }
        }
    }

    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.game.canvas.width, this.game.canvas.height);

        // Dibujar elementos interactivos del establo (solo si existen)
        if (this.apple) this.apple.draw(ctx);
        if (this.carriage) this.carriage.draw(ctx);
        if (this.oilCan) this.oilCan.draw(ctx);
        if (this.goldenHorseshoe) this.goldenHorseshoe.draw(ctx); // La herradura dorada al final

        // Dibujar el caballo
        if (this.horse) this.horse.draw(ctx);
        
        // Dibujar personajes
        this.player.draw(ctx);
        this.oldCouple.draw(ctx);

        // Mostrar el diálogo (si hay uno activo y no es quiz_time o game_over)
        if (this.dialogueStep < this.dialogue.length && this.gameState !== 'quiz_time' && this.gameState !== 'game_over_screen') {
            this.showDialogue(ctx, this.dialogue[this.dialogueStep]);
        }
        
        // Mostrar el quiz si es el momento
        if (this.showQuiz && this.gameState === 'quiz_time') {
            this.drawQuiz(ctx);
        }

        // Mostrar la pantalla de Game Over si el estado lo indica (copia de Level1Scene)
        if (this.gameState === 'game_over_screen') {
            // Asegúrate de tener la función drawGameOverScreen en Level2Scene también.
            // Si no la tienes, cópiala de Level1Scene.js
            this.drawGameOverScreen(ctx); 
        }
    }

    // Asegúrate de copiar drawGameOverScreen de Level1Scene si no lo tienes.
    drawGameOverScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("¡Oh no!", this.game.canvas.width / 2, this.game.canvas.height / 2 - 50);

        ctx.font = '18px Arial';
        this.wrapText(ctx, "ABUELOS: No has recordado bien. ¡Inténtalo de nuevo!", 
                      this.game.canvas.width / 2 - ((this.game.canvas.width - 100) / 2), 
                      this.game.canvas.height / 2 - 10, 
                      this.game.canvas.width - 100, 
                      25, 
                      'center'); 

        ctx.font = '16px Arial';
        ctx.fillText("Haz clic para reiniciar el nivel.", this.game.canvas.width / 2, this.game.canvas.height / 2 + 60);
        ctx.textAlign = 'left'; 
    }

    // --- Métodos de Diálogo y Utilidades (copiados de Level1Scene) ---
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
                // Aquí podrías añadir lógica si el diálogo finaliza y el estado debe cambiar
            }
        }
    }

    resetDialogueTimeout() {
        clearTimeout(this.dialogueTimeout);
        this.dialogueTimeout = setTimeout(() => {
            this.advanceDialogue();
        }, 5000); // Diálogo avanza automáticamente después de 5 segundos
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