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
        this.quizCorrectAnswers = 0;

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
                options: ["Rienda", "Montura"],
                correctAnswerIndex: 0 
            },
            {
                question: "ABUELO: ¿Que comida no le puedo dar a un caballo?",
                options: ["Azucar", "Carne"],
                correctAnswerIndex: 1 
            },
            {
                question: "ABUELA: ¿Qué se le echa a las ruedas de una carroza para que giren suavemente?",
                options: ["Grasa", "Aceite"],
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

        // Lógica para avanzar el diálogo (si no es quiz_time o es la fase de pregunta del quiz)
        // O si es quiz_time y el diálogo de feedback (correcto/incorrecto) está visible.
        if (this.dialogueStep < this.dialogue.length) {
            // Si estamos en quiz_time y el diálogo actual es el de la pregunta o el feedback de respuesta
            if (this.gameState === 'quiz_time') {
                this.advanceDialogue(); // Avanza el texto del diálogo
                // Si el diálogo ha terminado Y no estamos en game_over_screen, entonces mostramos las opciones del quiz
                // Ocultamos las opciones al seleccionar una, y las volvemos a mostrar si el diálogo de feedback ha terminado
                if (this.dialogueStep >= this.dialogue.length && this.gameState !== 'game_over_screen') {
                    // Si el diálogo de feedback ha terminado y estamos listos para la siguiente pregunta/intento
                    if (this.currentQuestionIndex < this.quizQuestions.length) { // Si aún hay preguntas pendientes
                        this.showQuiz = true; // Muestra las opciones para la siguiente pregunta/reintento
                    }
                }
                return; // Consumir el clic
            }
            // Si no es quiz_time (es un diálogo normal de tarea o entrada/salida)
            else if (this.gameState !== 'game_over_screen' && this.gameState !== 'level_complete' && this.gameState !== 'final_dialogue') {
                this.advanceDialogue();
                return; // Consumir el clic
            }
        }

        // Lógica de interacción con objetos y quiz (solo si el diálogo no está activo)
        if (this.dialogueStep >= this.dialogue.length) { // Asegura que el diálogo actual haya terminado
            if (this.gameState === 'task_feed_horse_apple') {
                if (this.apple && this.apple.isClicked(mouseX, mouseY) && !this.appleFedToHorse) {
                    this.appleFedToHorse = true;
                    this.setDialogue("JUGADOR: Le di la manzana al caballo. ¡Parece feliz!");
                    this.apple = null; // "Recoger" la manzana
                }
            } else if (this.gameState === 'task_clean_carriage') {
                if (this.carriage && this.carriage.isClicked(mouseX, mouseY) && !this.carriageClean) {
                    this.carriageClean = true;
                    this.setDialogue("JUGADOR: ¡La carroza está limpia!");
                    this.carriage.setAnimation('carriage_clean'); // Cambia el sprite de la carroza a limpia
                }
            } else if (this.gameState === 'task_oil_wheels') {
                if (this.oilCan && this.oilCan.isClicked(mouseX, mouseY) && !this.oilApplied) {
                    this.oilApplied = true;
                    this.setDialogue("JUGADOR: Las ruedas están aceitadas. ¡Listo!");
                    this.oilCan = null; // "Recoger" el tarro de aceite
                }
            } else if (this.gameState === 'quiz_time') {
                // Solo llama a handleQuizClick si las opciones están visibles
                if (this.showQuiz) {
                    this.handleQuizClick(mouseX, mouseY);
                }
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
            } else if (this.gameState === 'final_dialogue' && this.dialogueStep >= this.dialogue.length) {
                // Después del diálogo final del nivel, pasar al siguiente nivel
                this.game.changeScene('level3'); // O la escena que corresponda
            } else if (this.gameState === 'game_over_screen') {
                // En la pantalla de Game Over, cualquier clic reinicia el nivel
                this.game.changeScene('level2'); // Reinicia el nivel completo
                return;
            }
        }
    }

    handleQuizClick(mouseX, mouseY) {
        if (!this.showQuiz) return; // Las opciones no están visibles, no procesar clic

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
            this.showQuiz = false; // Oculta las opciones inmediatamente después de la selección

            if (selectedOptionIndex === currentQ.correctAnswerIndex) {
                this.quizCorrectAnswers++;
                this.setDialogue("¡Correcto! Muy bien.");
                this.advanceQuiz(); // Llama a advanceQuiz para la progresión
            } else {
                this.currentAttempts++;
                if (this.currentAttempts >= this.quizAttemptsPerQuestion) {
                    this.gameState = 'game_over_screen'; // Cambia a pantalla de Game Over
                    this.showQuiz = false;
                    // No muestres diálogo de feedback, pasa directo a Game Over
                } else {
                    this.setDialogue("ABUELOS: No has recordado bien. ¡Inténtalo de nuevo!");
                    this.gameState = 'game_over_screen';
                    this.showQuiz = false;
                }
            }
        }
    }

    advanceQuiz() {
        // Antes de avanzar a la siguiente pregunta, asegúrate de que el diálogo de feedback haya terminado.
        // O bien, puedes simplemente avanzar a la siguiente pregunta, y el handleClick se encargará de mostrar las opciones.

        this.currentQuestionIndex++; // Avanza a la siguiente pregunta

        if (this.currentQuestionIndex < this.quizQuestions.length) {
            // Todavía quedan preguntas, cargar la siguiente
            this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question);
            this.showQuiz = false; // Oculta las opciones hasta que el diálogo de la pregunta termine
            this.dialogueStep = 0; // Reinicia el paso del diálogo para la nueva pregunta
            this.currentAttempts = 0; // Reinicia los intentos para la nueva pregunta
        } else {
            // Se han respondido todas las preguntas
            if (this.quizCorrectAnswers === this.quizQuestions.length) {
                this.setDialogue("ABUELOS: ¡Lo lograste! ¡Otro recuerdo desbloqueado! ¡Busca la herradura dorada!");
                this.gameState = 'level_complete';
                // Crear y posicionar la herradura dorada GRANDE y CENTRADA
                const horseshoeScale = 4; // Más grande
                const horseshoeWidth = 32 * horseshoeScale;
                const horseshoeHeight = 32 * horseshoeScale;
                this.goldenHorseshoe = new InteractiveObject(
                    (this.game.canvas.width / 2) - (horseshoeWidth / 2),
                    (this.game.canvas.height / 2) - (horseshoeHeight / 2),
                    this.barnElementsSheet, // Usa la sheet correcta
                    this.barnElementAnimations,
                    'golden_horseshoe',
                    horseshoeScale
                );
            } else {
                // Si no se respondieron todas correctamente
                this.setDialogue("ABUELOS: No has recordado bien. ¡Inténtalo de nuevo!");
                this.gameState = 'game_over_screen';
                this.showQuiz = false;
            }
            this.showQuiz = false; // Asegura que las opciones del quiz no se dibujen más
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
        } else if (this.gameState === 'final_dialogue' && this.dialogueStep >= this.dialogue.length) {
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
                // --- SOLUCIÓN CLAVE ---
                // Si estamos en quiz_time y hay más preguntas, mostrar el quiz
                if (this.gameState === 'quiz_time' && this.currentQuestionIndex < this.quizQuestions.length) {
                    this.showQuiz = true;
                }
                // Si el diálogo final ha terminado, iniciar la salida de los personajes
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