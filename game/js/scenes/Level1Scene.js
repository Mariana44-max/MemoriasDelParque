class Level1Scene {
    constructor(game) {
        this.game = game;
        this.background = assetLoader.getAsset('background_coffeFarm');
        this.gameElementsSheet = assetLoader.getAsset('game_elements_sheet');

        this.player = new Player(-32, 200); // Posición inicial fuera de pantalla
        this.oldCouple = new OldCouple(-90, 200, -130, 200); // Posición inicial fuera de pantalla

        this.dialogue = [];
        this.dialogueStep = 0;
        this.dialogueTimeout = null;

        this.gameElementAnimations = {
            'recipe_book': { xOffset: 0, yOffset: 0, frameCount: 1 }, 
            'coffee_bean_red': { xOffset: 1, yOffset: 0, frameCount: 1 }, 
            'coffee_bean_green': { xOffset: 2, yOffset: 0, frameCount: 1 }, 
            'roasted_coffee_beans': { xOffset: 0, yOffset: 1, frameCount: 1 },
            'roasting_pan_empty': { xOffset: 1, yOffset: 1, frameCount: 1 }, 
            'totuma_roasted_coffee': { xOffset: 2, yOffset: 1, frameCount: 1 }
        };
        this.coffeeBeans = [];
        this.maxBeansToCollect = 3; 

        this.coffeeBeans.push(new InteractiveObject(150, 200, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 1.5));
        this.coffeeBeans.push(new InteractiveObject(250, 220, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 1.5));
        this.coffeeBeans.push(new InteractiveObject(350, 190, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 1.5));

        this.roastingPan = new InteractiveObject(450, 250, this.gameElementsSheet, this.gameElementAnimations, 'roasting_pan_empty', 2);

        this.amuletPiece1 = null;

        this.coffeeBeans = [];
        this.maxBeansToCollect = 5;

        // Crear granos de café rojos (ejemplos de posición, ajustar según tu fondo)
        this.coffeeBeans.push(new InteractiveObject(150, 200, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 0.75));
        this.coffeeBeans.push(new InteractiveObject(250, 220, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 0.75));
        this.coffeeBeans.push(new InteractiveObject(180, 190, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 0.75));
        this.coffeeBeans.push(new InteractiveObject(250, 220, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 0.75));
        this.coffeeBeans.push(new InteractiveObject(200, 190, this.gameElementsSheet, this.gameElementAnimations, 'coffee_bean_red', 0.75));

        // Sartén de tostar café (asumo que está en un lugar fijo del fondo)
        this.roastingPan = new InteractiveObject(250, 150, this.gameElementsSheet, this.gameElementAnimations, 'roasting_pan_empty', 2);

        this.amuletPiece1 = null; // La pieza del amuleto aparece al final del nivel

        // Variables de estado del minijuego
        this.collectedBeans = 0;
        this.roastedCoffee = false;
        this.servedCoffee = false;

        // Estados del nivel
        this.gameState = 'initial_entry'; // 'initial_entry', 'initial_dialogue', 'collect_beans', 'roast_coffee', 'serve_coffee', 'quiz_time', 'level_complete', 'game_over_screen'

        // Preguntas del quiz
        this.quizQuestions = [
            {
                question: "ABUELA: ¿De qué color son los granos de café maduros, listos para cosechar?",
                options: ["Verdes", "Rojos"],
                correctAnswerIndex: 1 // Rojos
            },
            {
                question: "ABUELO: ¿Cuál es el último paso para que el café esté listo para beber, después de tostarlo y molerlo?",
                options: ["Empacarlo para vender", "Prepararlo en una bebida caliente"],
                correctAnswerIndex: 1 // Prepararlo
            }
        ];
        this.currentQuestionIndex = 0;
        this.showQuiz = false; // Controla la visibilidad del quiz en pantalla

        this.gameOverMessage = "ABUELOS: No has recordado bien nuestros pasos. ¡Inténtalo de nuevo!";
        this.gameOverPrompt = "Haz clic para reiniciar el nivel.";

        this.finalDialogueMessages = [
            "ABUELA: ¡Qué rico aroma! ¡Recuerdo el café caliente que mi mamá nos preparaba cada mañana en la finca!",
            "ABUELO: ¡Y esta es la primera pieza del amuleto familiar! ¡Gracias a ti, los recuerdos regresan!"
        ];
    }

    init() {
        // Reiniciar posiciones y estados al inicio del nivel
        this.player.x = -32; 
        this.player.y = 200;
        this.player.startWalking('right'); // Jugador entra por la izquierda

        this.oldCouple.grandmaX = -90; 
        this.oldCouple.grandmaY = 200;
        this.oldCouple.grandpaX = -130; 
        this.oldCouple.grandpaY = 200;
        this.oldCouple.startWalking('right'); // Abuelos entran por la izquierda

        this.collectedBeans = 0;
        this.roastedCoffee = false;
        this.servedCoffee = false;
        this.amuletPiece1 = null;
        this.roastingPan.setAnimation('roasting_pan_empty'); // Asegura que la sartén esté vacía

        // Reinicia los granos de café a su estado inicial
        this.coffeeBeans.forEach(bean => {
            bean.setAnimation('coffee_bean_red');
        });

        this.currentQuestionIndex = 0;
        this.showQuiz = false;

        this.gameState = 'initial_entry';
        // Añadir el listener para el clic
        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    destroy() {
        // Limpiar el listener de eventos al salir de la escena
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        if (this.gameState === 'game_over_screen') {
            this.game.changeScene('level1'); // Reiniciar Level1Scene
            return;
        }

        // Avance de diálogo en estados específicos
        if (this.gameState === 'initial_dialogue' || 
            this.gameState === 'task_dialogue_1' || 
            this.gameState === 'task_dialogue_2' || 
            this.gameState === 'task_dialogue_3' || 
            this.gameState === 'final_dialogue') {
            this.advanceDialogue();
        } else if (this.gameState === 'collect_beans') {
            this.collectCoffeeBeans(mouseX, mouseY);
        } else if (this.gameState === 'roast_coffee') {
            this.tryRoastCoffee(mouseX, mouseY);
        } else if (this.gameState === 'serve_coffee') {
            this.tryServeCoffee(mouseX, mouseY);
        } else if (this.gameState === 'quiz_time') {
            this.handleQuizClick(mouseX, mouseY);
        } else if (this.gameState === 'level_complete') {
            if (this.amuletPiece1 && this.amuletPiece1.isClicked(mouseX, mouseY)) {
                this.amuletPiece1 = null; // "Recoger" la pieza del amuleto
                this.gameState = 'final_dialogue'; // Iniciar el diálogo final
                this.setDialogue(this.finalDialogueMessages);
                this.player.stopMoving();
                this.oldCouple.stopMoving();
            } else {
                this.setDialogue("JUGADOR: Debo hacer clic en la pieza del amuleto para continuar.");
            }
        }
    }

    // Lógica para recoger granos de café
    collectCoffeeBeans(mouseX, mouseY) {
        let collectedThisClick = false;
        if (this.collectedBeans < this.maxBeansToCollect) {
            for (let i = 0; i < this.coffeeBeans.length; i++) {
                const bean = this.coffeeBeans[i];
                // Solo interactuar con granos rojos
                if (bean.currentAnimation === this.gameElementAnimations['coffee_bean_red'] && bean.isClicked(mouseX, mouseY)) {
                    this.collectedBeans++;
                    collectedThisClick = true;
                    // Cambia el sprite del grano a "recogido" (verde)
                    bean.setAnimation('coffee_bean_green'); 
                    this.setDialogue(`JUGADOR: ¡He recogido un grano de café rojo! (${this.collectedBeans}/${this.maxBeansToCollect})`);
                    break; 
                }
            }
            
            if (!collectedThisClick && this.collectedBeans < this.maxBeansToCollect) {
                this.setDialogue("JUGADOR: No hay más granos rojos aquí para recoger o no lo clickeaste.");
            }
        }
    }

    // Lógica para tostar café
    tryRoastCoffee(mouseX, mouseY) {
        if (this.gameState === 'roast_coffee' && this.roastingPan.isClicked(mouseX, mouseY)) {
            if (!this.roastedCoffee) {
                this.roastedCoffee = true;
                // Cambia el sprite de la sartén para mostrar el café tostado/la totuma
                this.roastingPan.setAnimation('totuma_roasted_coffee'); 
                this.setDialogue("JUGADOR: El café se ha tostado. ¡Qué buen aroma!");
            } else {
                this.setDialogue("JUGADOR: El café ya está tostado.");
            }
        } else if (this.gameState === 'roast_coffee' && !this.roastingPan.isClicked(mouseX, mouseY)) {
            this.setDialogue("JUGADOR: Debo hacer clic en la sartén para tostar el café.");
        }
    }

    // Lógica para servir café
    tryServeCoffee(mouseX, mouseY) {
        if (this.gameState === 'serve_coffee' && this.roastingPan.isClicked(mouseX, mouseY)) {
            if (!this.servedCoffee && this.roastedCoffee) {
                this.servedCoffee = true;
                this.setDialogue("ABUELA: ¡Mmm, el café está listo! ¡Gracias!");
            } else if (!this.roastedCoffee) {
                this.setDialogue("JUGADOR: Primero debo tostar el café antes de servirlo.");
            } else {
                this.setDialogue("JUGADOR: El café ya ha sido servido.");
            }
        } else if (this.gameState === 'serve_coffee' && !this.roastingPan.isClicked(mouseX, mouseY)) {
            this.setDialogue("JUGADOR: Debo hacer clic en el café tostado para servirlo.");
        }
    }

    // Lógica para manejar las respuestas del quiz
    handleQuizClick(mouseX, mouseY) {
        if (!this.showQuiz) return;

        const currentQ = this.quizQuestions[this.currentQuestionIndex];
        if (!currentQ) return;

        const optionX = 20; // x inicial para las opciones
        const optionWidth = this.game.canvas.width - 40; // Ancho de la caja de opción
        const optionHeight = 30; // Alto de la caja de opción
        const option1Y = this.game.canvas.height - 80; // Posición Y para la primera opción
        const option2Y = this.game.canvas.height - 40; // Posición Y para la segunda opción

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
                    this.setDialogue("ABUELOS: ¡Lo lograste! ¡Otro recuerdo desbloqueado! Busca la pieza del amuleto.");
                    // Posicionar la pieza del amuleto en el centro
                    const amuletScale = 2; // Para que sea visible
                    const amuletWidth = this.gameElementAnimations.amulet_piece_1.width || 32 * amuletScale; 
                    const amuletHeight = this.gameElementAnimations.amulet_piece_1.height || 32 * amuletScale;
                    this.amuletPiece1 = new InteractiveObject(
                        (this.game.canvas.width / 2) - (amuletWidth / 2),
                        (this.game.canvas.height / 2) - (amuletHeight / 2),
                        this.gameElementsSheet, 
                        this.gameElementAnimations, 
                        'amulet_piece_1', 
                        amuletScale
                    );
                    // Ajustar si InteractiveObject.width/height son 32 por defecto y el sprite es más grande
                    this.amuletPiece1.width = 32; 
                    this.amuletPiece1.height = 32;
                }
            } else {
                // Respuesta incorrecta
                this.gameState = 'game_over_screen';
            }
        }
    }

    update(deltaTime) {
        if (this.gameState === 'game_over_screen') {
            return; // Detiene la actualización si el juego ha terminado
        }

        // Lógica de entrada inicial
        if (this.gameState === 'initial_entry') {
            this.player.update(deltaTime);
            this.oldCouple.update(deltaTime);

            const movement = 2 * deltaTime / 12; // Velocidad de movimiento
            this.player.x += movement;
            this.oldCouple.grandmaX += movement;
            this.oldCouple.grandpaX += movement;

            // Cuando el jugador y los abuelos llegan a su posición de inicio
            if (this.player.x >= 100) { // Ajusta la posición de parada
                this.player.stopMoving();
                const stopXGrandma = this.game.canvas.width - 50; // Ejemplo de posición final de abuela
                const stopXGrandpa = stopXGrandma - 40; // Ejemplo de posición final de abuelo
                this.oldCouple.stopMoving();
                this.oldCouple.grandmaX = stopXGrandma; // Asegurarse de que se queden en la posición
                this.oldCouple.grandpaX = stopXGrandpa; 

                this.gameState = 'initial_dialogue';
                this.setDialogue("ABUELA: ¡Hola! Te estábamos esperando. ¡Espero que estés listo para ayudarnos de nuevo!");
            }
        } else if (this.gameState === 'final_dialogue') {
            this.player.update(deltaTime);
            this.oldCouple.update(deltaTime);

            // Si el diálogo final ha terminado, los personajes empiezan a salir
            if (this.dialogueStep >= this.dialogue.length) {
                this.player.startWalking('right'); // Jugador sale por la derecha
                this.oldCouple.startWalking('right'); // Abuelos salen por la derecha

                const movement = 2 * deltaTime / 16; 
                this.player.x += movement;
                this.oldCouple.grandmaX += movement;
                this.oldCouple.grandpaX += movement;

                // Cuando todos los personajes han salido de la pantalla
                if (this.player.x > this.game.canvas.width + this.player.width * this.player.scale) {
                    this.game.changeScene('level2'); // Transición al Nivel 2
                }
            }
        }

        // Actualizar animaciones de personajes y objetos
        this.player.update(deltaTime); // Asegura que el jugador siempre se actualice para animaciones de idle/stand
        this.oldCouple.update(deltaTime);
        this.coffeeBeans.forEach(bean => bean.update(deltaTime));
        this.roastingPan.update(deltaTime);
        if (this.amuletPiece1) {
            this.amuletPiece1.update(deltaTime);
        }


        // Lógica de progresión del nivel
        if (this.gameState === 'initial_dialogue' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_dialogue_1';
            this.setDialogue("ABUELO: Necesitamos recoger los granos de café rojos para tostarlos. ¡Están listos para la cosecha!");
        } else if (this.gameState === 'task_dialogue_1' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'collect_beans';
            this.setDialogue("JUGADOR: Debo hacer clic en los granos de café rojos. Llevo: " + this.collectedBeans + " / " + this.maxBeansToCollect);
        } else if (this.gameState === 'collect_beans' && this.collectedBeans >= this.maxBeansToCollect && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_dialogue_2';
            this.setDialogue("ABUELA: ¡Excelente! Ahora, hay que tostar los granos en la sartén para liberar su aroma.");
        } else if (this.gameState === 'task_dialogue_2' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'roast_coffee';
            this.setDialogue("JUGADOR: Haré clic en la sartén para tostar los granos.");
        } else if (this.gameState === 'roast_coffee' && this.roastedCoffee && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'task_dialogue_3';
            this.setDialogue("ABUELO: ¡El café tostado huele delicioso! Ahora, sírvelo para que lo podamos probar.");
        } else if (this.gameState === 'task_dialogue_3' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'serve_coffee';
            this.setDialogue("JUGADOR: Haré clic en la totuma con el café tostado para servirlo.");
        } else if (this.gameState === 'serve_coffee' && this.servedCoffee && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'quiz_time';
            // Solo muestra la pregunta si es la primera vez que entramos aquí o si ya respondimos la anterior
            if (this.currentQuestionIndex === 0 && !this.showQuiz) {
                this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question);
            }
            this.showQuiz = true; // Activa la visibilidad del quiz
        }
        // Las transiciones de 'quiz_time' a 'level_complete' o 'game_over_screen' se manejan en handleQuizClick.
    }

    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.game.canvas.width, this.game.canvas.height);

        // Dibujar objetos interactivos
        this.coffeeBeans.forEach(bean => bean.draw(ctx));
        this.roastingPan.draw(ctx);
        if (this.amuletPiece1) { // La pieza del amuleto solo se dibuja si el nivel está completo
            this.amuletPiece1.draw(ctx);
        }
        
        // Dibujar personajes
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

    // --- Métodos de Diálogo y Utilidades (mantén estos dentro de la clase) ---
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
                    // Si es el final del diálogo final, los personajes salen
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