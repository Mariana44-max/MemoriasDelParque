// game/js/scenes/Level1Scene.js

/**
 * Clase para representar un objeto interactivo en el juego.
 */
class InteractiveObject {
    constructor(x, y, spriteSheet, animations, initialAnimation = 'default_animation', scale = 1.5) {
        this.x = x;
        this.y = y;
        this.width = 32; // Ancho original de un frame del sprite
        this.height = 32; // Alto original de un frame del sprite
        this.scale = scale; // Factor de escalado para dibujar en el canvas (32*scale)
        this.spriteSheet = spriteSheet;
        this.animations = animations;

        // Asegurarse de que la animación inicial exista
        if (this.animations[initialAnimation]) {
            this.currentAnimation = this.animations[initialAnimation];
        } else {
            console.warn(`Animación inicial "${initialAnimation}" no encontrada para InteractiveObject.`);
            this.currentAnimation = { xOffset: 0, yOffset: 0, frameCount: 1 }; // Fallback
        }
        
        this.currentFrameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 200; // Velocidad de animación por defecto (si el objeto tuviera varios frames)
    }

    update(deltaTime) {
        // Lógica de animación para objetos si tienen múltiples frames
        if (this.currentAnimation && this.currentAnimation.frameCount > 1) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameDelay) {
                this.currentFrameIndex = (this.currentFrameIndex + 1) % this.currentAnimation.frameCount;
                this.frameTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (!this.currentAnimation || !this.spriteSheet) return;

        const sourceX = (this.currentAnimation.xOffset + this.currentFrameIndex) * this.width;
        const sourceY = this.currentAnimation.yOffset * this.height;

        ctx.drawImage(
            this.spriteSheet,
            sourceX,
            sourceY,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width * this.scale,
            this.height * this.scale
        );
    }

    /**
     * Cambia la animación actual del objeto.
     * @param {string} animName El nombre de la animación a establecer.
     */
    setAnimation(animName) {
        if (this.animations[animName]) {
            this.currentAnimation = this.animations[animName];
            this.currentFrameIndex = 0; // Reiniciar el frame al cambiar de animación
            this.frameTimer = 0;
        } else {
            console.warn(`Animación "${animName}" no encontrada para el objeto interactivo.`);
        }
    }

    /**
     * Comprueba si un punto (ej. el clic del mouse) está dentro del área del objeto.
     * @param {number} mouseX Coordenada X del mouse.
     * @param {number} mouseY Coordenada Y del mouse.
     * @returns {boolean} Verdadero si el punto está dentro del objeto, falso en caso contrario.
     */
    isClicked(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + (this.width * this.scale) &&
               mouseY >= this.y && mouseY <= this.y + (this.height * this.scale);
    }
}


/**
 * Clase para la escena del Nivel 1.
 */
class Level1Scene {
    constructor(game) {
        this.game = game;
        this.background = assetLoader.getAsset('background_coffeFarm');
        this.elementsSheet = assetLoader.getAsset('game_elements_sheet'); 

        this.player = new Player(-32, 200); // El jugador se posicionará al inicio del nivel
        this.oldCouple = new OldCouple(-90, 160, -130, 200); // Los abuelos aparecen detrás del jugador inicialmente

        // Variables de estado del diálogo
        this.dialogue = [];
        this.dialogueStep = 0;
        this.dialogueTimeout = null;
        this.currentDialogueSpeaker = null; 

        // Estados del nivel:
        // 'initial_entry': Jugador y abuelos entrando en pantalla.
        // 'player_positioning': Jugador se posiciona en la izquierda, abuelos se van a la derecha.
        // 'initial_dialogue': Diálogo de introducción a la tarea.
        // 'collect_coffee': Recolección de granos.
        // 'roast_coffee': Tostado del café.
        // 'quiz_time': Fase de preguntas y respuestas.
        // 'level_complete': Nivel terminado, libro aparece y espera un clic.
        // 'final_dialogue': Diálogo final y salida de la escena.
        // 'game_over_screen': Pantalla de Game Over.
        this.gameState = 'initial_entry'; 

        // Definición de las animaciones/sprites para los objetos interactivos
        this.elementAnimations = {
            'recipe_book': { xOffset: 0, yOffset: 0, frameCount: 1 }, 
            'coffee_bean_red': { xOffset: 1, yOffset: 0, frameCount: 1 }, 
            'coffee_bean_green': { xOffset: 2, yOffset: 0, frameCount: 1 }, 

            'coffee_bean_red_damaged': { xOffset: 0, yOffset: 1, frameCount: 1 }, 
            'coffee_bean_green_damaged': { xOffset: 1, yOffset: 1, frameCount: 1 }, 
            'coffee_bean_red_worm': { xOffset: 2, yOffset: 1, frameCount: 1 }, 

            'coffee_bean_green_worm': { xOffset: 0, yOffset: 2, frameCount: 1 }, 
            'coffee_bean_roasted': { xOffset: 1, yOffset: 2, frameCount: 1 }, 
            'sorting_tray': { xOffset: 2, yOffset: 2, frameCount: 1 }, 

            'pan': { xOffset: 0, yOffset: 3, frameCount: 1 }, 
            'wooden_spoon': { xOffset: 1, yOffset: 3, frameCount: 1 }, 
            'totuma_roasted_coffee': { xOffset: 2, yOffset: 3, frameCount: 1 }, 
        };

        // Instancias de objetos interactivos en el nivel
        // Granos de café dispersos (usando un scale más pequeño)
        this.coffeeBeans = [
            new InteractiveObject(150, 150, this.elementsSheet, this.elementAnimations, 'coffee_bean_red', 0.8), 
            new InteractiveObject(220, 180, this.elementsSheet, this.elementAnimations, 'coffee_bean_red', 0.8),
            new InteractiveObject(170, 230, this.elementsSheet, this.elementAnimations, 'coffee_bean_red', 0.8),
            new InteractiveObject(100, 250, this.elementsSheet, this.elementAnimations, 'coffee_bean_red', 0.8),
            new InteractiveObject(280, 200, this.elementsSheet, this.elementAnimations, 'coffee_bean_red', 0.8)
        ];
        // La sartén para tostar
        this.roastingPan = new InteractiveObject(250, 200, this.elementsSheet, this.elementAnimations, 'pan', 1.5);
        this.recipeBook = null; // El libro aparecerá al final del nivel

        // Variables de progreso para los minijuegos
        this.collectedBeans = 0;
        this.maxBeansToCollect = this.coffeeBeans.length; // Recolectar todos los granos
        this.roastedCoffee = false; // Estado del tostado del café

        // Variables para el sistema de preguntas
        this.quizQuestions = [
            {
                question: "ABUELO: ¿Cuál es el color del grano de café maduro listo para recolectar?",
                options: ["Rojo intenso", "Verde brillante"],
                correctAnswerIndex: 0 // Rojo intenso
            },
            {
                question: "ABUELA: ¿Que método utilizamos para tostar el café?",
                options: ["Dejarlo al sol", "Usar una sartén de hierro"],
                correctAnswerIndex: 1 // Sartén de hierro
            },
            {
                question: "ABUELO: ¿Qué nos evoca el aroma del café recién tostado?",
                options: ["Recuerdos olvidados", "Sueño profundo"],
                correctAnswerIndex: 0 // Recuerdos olvidados
            }
        ];
        this.currentQuestionIndex = 0;
        this.showQuiz = false; // Controla cuándo se muestra el quiz

        this.gameOverMessage = "ABUELOS: Lo siento, nuestros recuerdos siguen confusos. ¡Inténtalo de nuevo!";
        this.gameOverPrompt = "Haz clic para reiniciar el nivel.";

        this.finalDialogueMessages = [
            "ABUELA: ¡Oh, mi libro de recetas! ¡Lo has encontrado! ¡Ahora recuerdo todos los secretos de nuestro café!",
            "ABUELO: Gracias, joven. Pero esto aún no termina."
        ];
    }

    /**
     * Inicializa la escena, posiciona a los personajes y activa los listeners.
     */
    init() {
        // Posiciones iniciales de los personajes al aparecer en el Nivel 1
        this.player.x = -32; 
        this.player.y = 200;
        this.player.startWalking('right'); 

        this.oldCouple.grandmaX = -90; 
        this.oldCouple.grandmaY = 210;
        this.oldCouple.grandpaX = -130; 
        this.oldCouple.grandpaY = 200;
        this.oldCouple.startWalking('right'); 

        // Reiniciar estados del nivel para un nuevo inicio
        this.collectedBeans = 0;
        this.roastedCoffee = false;
        this.recipeBook = null; 
        this.gameState = 'initial_entry'; // Iniciar con la entrada de los personajes
        this.currentQuestionIndex = 0;
        this.showQuiz = false;

        // Reiniciar el estado de los granos de café si fueron recolectados antes
        this.coffeeBeans.forEach(bean => bean.setAnimation('coffee_bean_red'));

        // Reiniciar la sartén a su estado original
        this.roastingPan.setAnimation('pan');

        // Añadir el listener de clic para avanzar el diálogo y interactuar
        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    /**
     * Limpia los listeners y timers al salir de la escena.
     */
    destroy() {
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
    }

    /**
     * Maneja los clics del mouse para avanzar el diálogo o interactuar con objetos.
     */
    handleClick(event) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        // Si estamos en la pantalla de Game Over, un clic reinicia el nivel
        if (this.gameState === 'game_over_screen') {
            this.game.changeScene('level1'); // Reiniciar Level1Scene
            return; // No procesar más clics
        }

        // Si estamos en un estado de diálogo, solo avanzamos el diálogo
        if (this.gameState === 'initial_dialogue' || this.gameState === 'final_dialogue') {
            this.advanceDialogue();
        } else if (this.gameState === 'level_complete') {
            // Si el libro existe y fue clicado
            if (this.recipeBook && this.recipeBook.isClicked(mouseX, mouseY)) {
                this.recipeBook = null; // Hacer que el libro desaparezca
                this.gameState = 'final_dialogue'; // Cambiar a estado de diálogo final
                this.setDialogue(this.finalDialogueMessages); // Iniciar el diálogo final
                this.player.stopMoving(); // Asegurar que el jugador esté detenido para el diálogo
                this.oldCouple.stopMoving(); // Asegurar que los abuelos estén detenidos
            } else {
                this.setDialogue("JUGADOR: Debo hacer clic en el libro para continuar."); // Mensaje si hace clic fuera del libro
            }
        } else if (this.gameState === 'quiz_time') { // Si estamos en el quiz
            this.handleQuizClick(mouseX, mouseY);
        } else if (this.gameState === 'collect_coffee') {
            this.tryCollectCoffee(mouseX, mouseY);
        } else if (this.gameState === 'roast_coffee') {
            this.tryRoastCoffee(mouseX, mouseY);
        }
    }

    /**
     * Maneja los clics durante la fase de quiz.
     */
    handleQuizClick(mouseX, mouseY) {
        if (!this.showQuiz) return;

        const currentQ = this.quizQuestions[this.currentQuestionIndex];
        if (!currentQ) return;

        // Coordenadas para los botones de opción (deben coincidir con drawQuiz)
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
            this.showQuiz = false; // Ocultar el quiz inmediatamente después de la selección

            if (selectedOptionIndex === currentQ.correctAnswerIndex) {
                // Respuesta correcta
                this.currentQuestionIndex++; // Avanzar a la siguiente pregunta
                if (this.currentQuestionIndex < this.quizQuestions.length) {
                    // Si hay más preguntas, mostrar la siguiente pregunta
                    this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question); 
                } else {
                    // Todas las preguntas respondidas correctamente
                    this.gameState = 'level_complete';
                    this.setDialogue(`ABUELOS: ¡Lo has logrado! ¡Ya estamos empezando a recordar!
                        
                        [Haz clic en el libro]`);
                    // Posicionar el libro en el centro de la pantalla
                    const bookWidth = 32 * 1.5; // Ancho del sprite escalado
                    const bookHeight = 32 * 1.5; // Alto del sprite escalado
                    this.recipeBook = new InteractiveObject(
                        (this.game.canvas.width / 2) - (bookWidth / 2),
                        (this.game.canvas.height / 2) - (bookHeight / 2),
                        this.elementsSheet, 
                        this.elementAnimations, 
                        'recipe_book', 
                        2.2
                    );
                }
            } else {
                // Respuesta incorrecta
                this.gameState = 'game_over_screen'; // Cambiar a estado de Game Over
            }
        }
    }

    /**
     * Actualiza el estado de la escena (movimiento de personajes, progresión del juego).
     * @param {number} deltaTime El tiempo transcurrido desde el último frame en milisegundos.
     */
    update(deltaTime) {
        // No actualizar nada si estamos en la pantalla de Game Over
        if (this.gameState === 'game_over_screen') {
            return; 
        }

        // Lógica de entrada inicial y posicionamiento del jugador y abuelos
        if (this.gameState === 'initial_entry') {
            this.player.update(deltaTime);
            this.oldCouple.update(deltaTime);

            const movement = 2 * deltaTime / 16; // Velocidad de entrada
            this.player.x += movement;
            this.oldCouple.grandmaX += movement;
            this.oldCouple.grandpaX += movement;

            // Cuando el jugador llega a su posición inicial a la izquierda
            if (this.player.x >= 100) { 
                this.player.stopMoving();
                this.gameState = 'player_positioning'; // Siguiente estado: abuelos se van
                this.oldCouple.startWalking('right'); // Abuelos empiezan a moverse hacia la derecha
            }
        } else if (this.gameState === 'player_positioning') {
            this.player.update(deltaTime); // Player ya está detenido
            this.oldCouple.update(deltaTime); // Abuelos continúan moviéndose

            const movement = 2 * deltaTime / 16; 
            this.oldCouple.grandmaX += movement;
            this.oldCouple.grandpaX += movement;

            // Cuando los abuelos llegan a su posición final al borde derecho (visible)
            // Detener la abuela a 50px del borde derecho, y el abuelo 40px antes que ella
            const stopXGrandma = this.game.canvas.width - 120; 
            const stopXGrandpa = stopXGrandma - 40; 

            if (this.oldCouple.grandmaX >= stopXGrandma) {
                this.oldCouple.stopMoving(); 
                // Fijar sus posiciones finales para asegurar que no se muevan más allá
                this.oldCouple.grandmaX = stopXGrandma; 
                this.oldCouple.grandpaX = stopXGrandpa; 
                
                this.gameState = 'initial_dialogue'; // Iniciar diálogo
                this.setDialogue("ABUELO: Este lugar... recuerdo algo sobre recoger café.");
            }
        } else if (this.gameState === 'final_dialogue') {
            this.player.update(deltaTime);
            this.oldCouple.update(deltaTime);

            // Si el diálogo final ha terminado, los personajes empiezan a salir
            if (this.dialogueStep >= this.dialogue.length) {
                this.player.startWalking('right');
                this.oldCouple.startWalking('right');

                const movement = 2 * deltaTime / 16; // Velocidad de salida
                this.player.x += movement;
                this.oldCouple.grandmaX += movement;
                this.oldCouple.grandpaX += movement;

                // Cuando todos los personajes han salido de la pantalla
                if (this.player.x > this.game.canvas.width + this.player.width * this.player.scale) {
                    this.game.changeScene('level2'); // Transición al siguiente nivel
                }
            }
        }

        // Los personajes ya no se mueven una vez que su posicionamiento inicial ha terminado,
        // excepto durante la entrada/salida o si el jugador se mueve por interacción.
        // Aquí actualizamos su animación si no están moviéndose por el "movement" global.
        if (this.gameState !== 'initial_entry' && this.gameState !== 'player_positioning' && this.gameState !== 'final_dialogue') {
            this.player.update(deltaTime); 
            this.oldCouple.update(deltaTime);
        }

        // Lógica de progresión del minijuego
        if (this.gameState === 'initial_dialogue' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'collect_coffee';
            this.setDialogue("JUGADOR: Debo recoger todos los granos de café que encuentre.");
        } else if (this.gameState === 'collect_coffee' && this.collectedBeans >= this.maxBeansToCollect && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'roast_coffee';
            this.setDialogue("JUGADOR: Ahora que tengo los granos, es hora de tostarlos en la sartén.");
            this.roastingPan.setAnimation('pan'); 
        } else if (this.gameState === 'roast_coffee' && this.roastedCoffee && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'quiz_time';
            // Solo establecer la pregunta inicial si no se ha iniciado el quiz
            if (this.currentQuestionIndex === 0 && !this.showQuiz) {
                 this.setDialogue(this.quizQuestions[this.currentQuestionIndex].question);
            }
            this.showQuiz = true; // Asegurarse de que el quiz se muestre
        } 
        // La transición de 'quiz_time' a 'level_complete' o 'game_over_screen' se maneja en handleQuizClick.

        // Actualizar todos los objetos interactivos (si tienen animaciones)
        this.coffeeBeans.forEach(bean => bean.update(deltaTime));
        this.roastingPan.update(deltaTime);
        if (this.recipeBook) {
            this.recipeBook.update(deltaTime);
        }
    }

    /**
     * Dibuja todos los elementos de la escena en el canvas.
     * @param {CanvasRenderingContext2D} ctx El contexto de renderizado 2D del canvas.
     */
    draw(ctx) {
        ctx.drawImage(this.background, 0, 0, this.game.canvas.width, this.game.canvas.height);

        // Dibujar elementos extra solo cuando sea su fase de interacción
        if (this.gameState === 'collect_coffee') {
            this.coffeeBeans.forEach(bean => {
                // Solo dibujar el grano si no ha sido recolectado (su animación es 'coffee_bean_red')
                if (bean.currentAnimation === this.elementAnimations['coffee_bean_red'] || bean.currentAnimation === this.elementAnimations['coffee_bean_green']) {
                     bean.draw(ctx);
                }
            });
        }
        
        // La sartén aparece en la fase de 'roast_coffee' o si el café ya ha sido tostado
        if (this.gameState === 'roast_coffee' || this.roastedCoffee || this.gameState === 'quiz_time' || this.gameState === 'level_complete' || this.gameState === 'final_dialogue') { 
            this.roastingPan.draw(ctx);
        }

        if (this.recipeBook) { // Dibujar el libro solo si existe (cuando se completa el nivel)
            this.recipeBook.draw(ctx);
        }
        
        // Dibujar personajes
        // Los abuelos si su posición está dentro del canvas (y no estamos en game_over_screen)
        if (this.gameState !== 'game_over_screen' && this.oldCouple.grandmaX < this.game.canvas.width && this.oldCouple.grandpaX < this.game.canvas.width) {
            this.oldCouple.draw(ctx); 
        }
        this.player.draw(ctx); // El jugador siempre está en pantalla en Level1, excepto en game_over_screen donde el canvas se sobrepone

        // Mostrar el diálogo si hay uno activo (y no estamos en quiz_time o game_over_screen)
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

    /**
     * Dibuja el cuadro de diálogo con el texto dado, aplicando word wrapping.
     * @param {CanvasRenderingContext2D} ctx El contexto de renderizado 2D.
     * @param {string} text El texto a mostrar en el diálogo.
     */
    showDialogue(ctx, text) {
        const boxX = 10;
        const boxY = this.game.canvas.height - 70;
        const boxWidth = this.game.canvas.width - 20;
        const boxHeight = 60;
        const padding = 10;
        const lineHeight = 18; // Espacio entre líneas

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; 
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight); 

        ctx.fillStyle = 'white';
        ctx.font = '14px Arial'; // Letra más pequeña

        // Implementar word wrapping
        this.wrapText(ctx, text, boxX + padding, boxY + padding + lineHeight, boxWidth - (padding * 2), lineHeight);
    }

    /**
     * Dibuja las preguntas y opciones del quiz, aplicando word wrapping.
     */
    drawQuiz(ctx) {
        const currentQ = this.quizQuestions[this.currentQuestionIndex];
        if (!currentQ) return; 

        const boxX = 10;
        const boxY = this.game.canvas.height - 130;
        const boxWidth = this.game.canvas.width - 20;
        const boxHeight = 120;
        const padding = 10;
        const lineHeight = 40; // Espacio entre líneas para el quiz

        // Fondo para la pregunta y opciones
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial'; // Fuente para la pregunta del quiz (un poco más pequeña que antes)
        
        // Pregunta con word wrapping
        this.wrapText(ctx, currentQ.question, boxX + padding, boxY + padding + lineHeight, boxWidth - (padding * 2), lineHeight);

        // Opciones de respuesta como "botones"
        ctx.font = '14px Arial'; // Fuente para las opciones (más pequeña)
        // Opción 1
        ctx.fillStyle = 'rgba(191, 107, 51, 0.8)'; 
        ctx.fillRect(20, this.game.canvas.height - 80, this.game.canvas.width - 40, 30);
        ctx.fillStyle = 'white';
        ctx.fillText(`A)${currentQ.options[0]}`, 30, this.game.canvas.height - 60);

        // Opción 2
        ctx.fillStyle = 'rgba(191, 107, 51, 0.8)'; 
        ctx.fillRect(20, this.game.canvas.height - 40, this.game.canvas.width - 40, 30);
        ctx.fillStyle = 'white';
        ctx.fillText(`B) ${currentQ.options[1]}`, 30, this.game.canvas.height - 20);
    }

    /**
     * Dibuja la pantalla de Game Over.
     * @param {CanvasRenderingContext2D} ctx El contexto de renderizado 2D.
     */
    drawGameOverScreen(ctx) {
        // Fondo semi-transparente oscuro
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);

        // Mensaje de Game Over
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText("¡Oh no!", this.game.canvas.width / 2, this.game.canvas.height / 2 - 50);

        ctx.font = '18px Arial';
        // Mensaje de los abuelos (con word wrapping)
        this.wrapText(ctx, this.gameOverMessage, 
                      this.game.canvas.width / 2 - ((this.game.canvas.width - 100) / 2), // X de inicio
                      this.game.canvas.height / 2 - 10, // Y de inicio
                      this.game.canvas.width - 100, // Ancho máximo
                      25, // Espacio entre líneas
                      'center'); // Alineación del texto

        ctx.font = '16px Arial';
        ctx.fillText(this.gameOverPrompt, this.game.canvas.width / 2, this.game.canvas.height / 2 + 60);
        ctx.textAlign = 'left'; // Reset textAlign
    }

    /**
     * Función auxiliar para envolver el texto (word wrapping).
     * @param {CanvasRenderingContext2D} ctx El contexto de renderizado 2D.
     * @param {string} text El texto a dibujar.
     * @param {number} x La coordenada X de inicio.
     * @param {number} y La coordenada Y de inicio.
     * @param {number} maxWidth El ancho máximo de la línea.
     * @param {number} lineHeight La altura de cada línea de texto.
     * @param {string} align La alineación del texto ('left', 'center', 'right').
     */
    wrapText(ctx, text, x, y, maxWidth, lineHeight, align = 'left') {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        // Guarda la alineación actual del contexto para restaurarla
        const originalTextAlign = ctx.textAlign;
        ctx.textAlign = align;

        let lineX = x;
        if (align === 'center') {
            lineX = x + maxWidth / 2; // Ajustar X para centrado
        } else if (align === 'right') {
            lineX = x + maxWidth; // Ajustar X para derecha
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
        ctx.textAlign = originalTextAlign; // Restaura la alineación original
    }

    /**
     * Establece un nuevo diálogo y lo inicia desde el primer paso.
     * @param {string|string[]} text El texto del nuevo diálogo (puede ser una cadena o un array de cadenas).
     */
    setDialogue(text) {
        this.dialogue = Array.isArray(text) ? text : [text]; 
        this.dialogueStep = 0;
        this.resetDialogueTimeout();
    }

    /**
     * Avanza al siguiente paso del diálogo.
     */
    advanceDialogue() {
        if (this.dialogueStep < this.dialogue.length) {
            this.dialogueStep++;
            if (this.dialogueStep < this.dialogue.length) {
                this.resetDialogueTimeout(); 
            } else {
                clearTimeout(this.dialogueTimeout); 
                // Si el diálogo ha terminado y estamos en quiz_time, asegúrate de que el quiz se muestre.
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

    /**
     * Reinicia el temporizador para el avance automático del diálogo.
     */
    resetDialogueTimeout() {
        clearTimeout(this.dialogueTimeout);
        this.dialogueTimeout = setTimeout(() => {
            this.advanceDialogue();
        }, 5000); // 5 segundos para cada línea de diálogo, ajustable
    }

    /**
     * Lógica para intentar recolectar café. Se activa con un clic.
     * @param {number} mouseX Coordenada X del clic.
     * @param {number} mouseY Coordenada Y del clic.
     */
    tryCollectCoffee(mouseX, mouseY) {
        if (this.gameState === 'collect_coffee') {
            let collectedThisClick = false;
            // Busca si algún grano de café fue clickeado
            for (let i = 0; i < this.coffeeBeans.length; i++) {
                const bean = this.coffeeBeans[i];
                // Solo si el grano aún es "rojo" (no recolectado) y fue clickeado
                if (bean.currentAnimation === this.elementAnimations['coffee_bean_red'] && bean.isClicked(mouseX, mouseY)) {
                    this.collectedBeans++;
                    collectedThisClick = true;
                    // Cambiar el sprite del grano para indicar que fue recolectado (a verde)
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

    /**
     * Lógica para intentar tostar café. Se activa con un clic.
     * @param {number} mouseX Coordenada X del clic.
     * @param {number} mouseY Coordenada Y del clic.
     */
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
}