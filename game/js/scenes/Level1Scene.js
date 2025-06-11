class InteractiveObject {
    constructor(x, y, spriteSheet, animations, initialAnimation = 'default_animation') {
        this.x = x;
        this.y = y;
        this.width = 32; // Ancho original de un frame del sprite
        this.height = 32; // Alto original de un frame del sprite
        this.scale = 1.5; // Factor de escalado para dibujar en el canvas (32*1.5 = 48)
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
        if (!this.currentAnimation || !this.spriteSheet) return; // Asegurar que hay algo para dibujar

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
     * Comprueba si el jugador está lo suficientemente cerca para interactuar.
     * @param {Player} player La instancia del jugador.
     * @returns {boolean} Verdadero si el jugador está cerca, falso en caso contrario.
     */
    isNear(player) {
        // Calcula los centros de los bounding boxes para una distancia más precisa
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        const objectCenterX = this.x + (this.width * this.scale) / 2;
        const objectCenterY = this.y + (this.height * this.scale) / 2;

        const distance = Math.sqrt(
            Math.pow(playerCenterX - objectCenterX, 2) +
            Math.pow(playerCenterY - objectCenterY, 2)
        );
        return distance < 60; // Distancia de interacción en píxeles, ajustable
    }
}


/**
 * Clase para la escena del Nivel 1.
 */
class Level1Scene {
    constructor(game) {
        this.game = game;
        this.background = assetLoader.getAsset('background_coffeFarm');
        // Usamos el nuevo nombre de asset
        this.elementsSheet = assetLoader.getAsset('game_elements_sheet'); 

        this.player = new Player(-32, 200); // El jugador se posicionará al inicio del nivel
        // Los abuelos se posicionan en relación al jugador al inicio del nivel
        this.oldCouple = new OldCouple(this.player.x - 50, this.player.y, this.player.x - 90, this.player.y); 

        // Variables de estado del diálogo
        this.dialogue = [];
        this.dialogueStep = 0;
        this.dialogueTimeout = null;
        this.currentDialogueSpeaker = null; 

        // Estados del minijuego para controlar la progresión del nivel
        // 'initial_dialogue': Diálogo de introducción al nivel.
        // 'collect_coffee': Recolección de granos rojos.
        // 'separate_coffee': Separación de granos buenos de malos.
        // 'roast_coffee': Tostado del café.
        // 'final_dialogue_level1': Diálogo final y aparición del libro.
        this.gameState = 'initial_dialogue'; 

        // Definición de las animaciones/sprites para los objetos interactivos
        // Basado en la nueva sprite sheet "New Piskel.png" (ahora game_elements.png)
        this.elementAnimations = {
            'recipe_book': { xOffset: 0, yOffset: 0, frameCount: 1 }, // Fila 0, Columna 0
            'coffee_bean_red': { xOffset: 1, yOffset: 0, frameCount: 1 }, // Fila 0, Columna 1
            'coffee_bean_green': { xOffset: 2, yOffset: 0, frameCount: 1 }, // Fila 0, Columna 2

            'coffee_bean_red_damaged': { xOffset: 0, yOffset: 1, frameCount: 1 }, // Fila 1, Columna 0
            'coffee_bean_green_damaged': { xOffset: 1, yOffset: 1, frameCount: 1 }, // Fila 1, Columna 1
            'coffee_bean_red_worm': { xOffset: 2, yOffset: 1, frameCount: 1 }, // Fila 1, Columna 2

            'coffee_bean_green_worm': { xOffset: 0, yOffset: 2, frameCount: 1 }, // Fila 2, Columna 0
            'coffee_bean_roasted': { xOffset: 1, yOffset: 2, frameCount: 1 }, // Fila 2, Columna 1
            'sorting_tray': { xOffset: 2, yOffset: 2, frameCount: 1 }, // Fila 2, Columna 2

            'pan': { xOffset: 0, yOffset: 3, frameCount: 1 }, // Fila 3, Columna 0
            'wooden_spoon': { xOffset: 1, yOffset: 3, frameCount: 1 }, // Fila 3, Columna 1
            'totuma_roasted_coffee': { xOffset: 2, yOffset: 3, frameCount: 1 }, // Fila 3, Columna 2
        };

        // Instancias de objetos interactivos en el nivel
        // Posicionamiento de los objetos interactivos en el canvas
        this.coffeeSources = [
            new InteractiveObject(100, 200, this.elementsSheet, this.elementAnimations, 'coffee_bean_red'),
            new InteractiveObject(180, 180, this.elementsSheet, this.elementAnimations, 'coffee_bean_red'),
            new InteractiveObject(250, 210, this.elementsSheet, this.elementAnimations, 'coffee_bean_red')
        ];
        this.sortingStation = new InteractiveObject(350, 200, this.elementsSheet, this.elementAnimations, 'sorting_tray');
        this.roastingPan = new InteractiveObject(420, 200, this.elementsSheet, this.elementAnimations, 'pan');
        this.recipeBook = null; // El libro aparecerá al final del nivel

        // Variables de progreso para los minijuegos
        this.collectedBeans = 0;
        this.maxBeansToCollect = 3; // Cuántos granos rojos debe "recolectar" el jugador
        this.goodBeansSeparated = 0;
        this.totalGoodBeansNeeded = 5; // Cuántos granos buenos debe "separar" el jugador (simulado)
        this.roastedCoffee = false; // Estado del tostado del café
    }

    /**
     * Inicializa la escena, posiciona a los personajes y activa los listeners.
     */
    init() {
        // Posiciones iniciales de los personajes al aparecer en el Nivel 1
        this.player.x = -32; // Inicia fuera de la pantalla
        this.player.y = 200;
        this.player.startWalking('right'); // El jugador comienza a moverse a la derecha

        this.oldCouple.grandmaX = this.player.x - 50; // Abuela detrás del jugador
        this.oldCouple.grandmaY = this.player.y;
        this.oldCouple.grandpaX = this.player.x - 90; // Abuelo detrás de la abuela
        this.oldCouple.grandpaY = this.player.y;
        this.oldCouple.startWalking('right'); // Los abuelos también empiezan a moverse

        // Reiniciar estados del nivel para un nuevo inicio
        this.collectedBeans = 0;
        this.goodBeansSeparated = 0;
        this.roastedCoffee = false;
        this.recipeBook = null; // Asegurarse de que el libro no esté al inicio
        this.gameState = 'initial_dialogue'; // Siempre iniciar con el diálogo

        // Definir el diálogo inicial del Nivel 1
        this.dialogue = [
            "JUGADOR: ¡Qué lindo se ve el cafetal!",
            "ABUELO: Sí, este es el lugar donde solíamos venir a recoger el café.",
            "ABUELO: Recuerdo que había que recoger los granos maduros, los de color rojo.",
            "JUGADOR: Entendido, buscaré los granos rojos."
        ];
        this.dialogueStep = 0;
        this.resetDialogueTimeout(); // Iniciar el temporizador para el avance automático del diálogo
        
        // Añadir el listener de clic para avanzar el diálogo y interactuar
        this.game.canvas.addEventListener('click', this.handleClick.bind(this));
        // Los listeners de teclado se manejan globalmente en Game.js, no es necesario aquí.
    }

    /**
     * Limpia los listeners y timers al salir de la escena.
     */
    destroy() {
        clearTimeout(this.dialogueTimeout);
        this.game.canvas.removeEventListener('click', this.handleClick.bind(this));
        // No necesitamos remover listeners de teclado aquí si Game.js los maneja.
    }

    /**
     * Maneja los clics del mouse para avanzar el diálogo o interactuar con objetos.
     */
    handleClick() {
        if (this.gameState === 'initial_dialogue' || this.gameState === 'final_dialogue_level1') {
            this.advanceDialogue(); // Solo avanza el diálogo si estamos en fase de diálogo
        } else if (this.gameState === 'collect_coffee') {
            this.tryCollectCoffee(); // Intenta recolectar café
        } else if (this.gameState === 'separate_coffee') {
            this.trySeparateCoffee(); // Intenta separar café
        } else if (this.gameState === 'roast_coffee') {
            this.tryRoastCoffee(); // Intenta tostar café
        }
    }

    /**
     * Actualiza el estado de la escena (movimiento de personajes, progresión del juego).
     * @param {number} deltaTime El tiempo transcurrido desde el último frame en milisegundos.
     */
    update(deltaTime) {
        // Transición de entrada del jugador y abuelos al inicio del nivel
        if (this.player.x < 100 && this.player.currentAction === 'walking') {
            this.player.update(deltaTime);
            this.oldCouple.update(deltaTime);
        } else if (this.player.x >= 100 && this.player.currentAction === 'walking') {
            this.player.stopMoving(); // Jugador se detiene al llegar a la posición inicial
            this.oldCouple.stopMoving(); // Abuelos también se detienen
            // Asegura que el diálogo inicial del nivel comience si ya está en la posición
            if (this.gameState === 'initial_dialogue' && this.dialogueStep === 0) {
                this.resetDialogueTimeout();
            }
        }

        // Lógica de movimiento del jugador basada en las teclas (flechas y WASD)
        let playerIsMoving = false;
        if (this.game.keys['ArrowUp'] || this.game.keys['w']) {
            this.player.startWalking('up');
            this.player.y -= this.player.speed * deltaTime / 16; // Ajuste de velocidad con deltaTime
            playerIsMoving = true;
        } else if (this.game.keys['ArrowDown'] || this.game.keys['s']) {
            this.player.startWalking('down');
            this.player.y += this.player.speed * deltaTime / 16;
            playerIsMoving = true;
        } else if (this.game.keys['ArrowLeft'] || this.game.keys['a']) {
            this.player.startWalking('left');
            this.player.x -= this.player.speed * deltaTime / 16;
            playerIsMoving = true;
        } else if (this.game.keys['ArrowRight'] || this.game.keys['d']) {
            this.player.startWalking('right');
            this.player.x += this.player.speed * deltaTime / 16;
            playerIsMoving = true;
        } 
        
        // Si no se presiona ninguna tecla de movimiento, el jugador se detiene
        if (!playerIsMoving && this.player.currentAction === 'walking') {
            this.player.stopMoving();
        }

        // Actualizar el jugador y los abuelos (sus animaciones)
        this.player.update(deltaTime);
        // Por ahora, los abuelos se quedan estáticos. Si quieres que sigan al jugador,
        // necesitarías una lógica más avanzada aquí (e.g., this.oldCouple.follow(this.player, distance)).
        this.oldCouple.update(deltaTime); 

        // Lógica de progresión del minijuego basada en el gameState
        if (this.gameState === 'initial_dialogue' && this.dialogueStep >= this.dialogue.length) {
            this.gameState = 'collect_coffee';
            this.setDialogue("ABUELO: Ahora, a recolectar los granos rojos.");
        } else if (this.gameState === 'collect_coffee' && this.collectedBeans >= this.maxBeansToCollect) {
            this.gameState = 'separate_coffee';
            this.setDialogue("ABUELA: ¡Buen trabajo! Ahora hay que separar los granos buenos de los malos. Solo los rojos.");
        } else if (this.gameState === 'separate_coffee' && this.goodBeansSeparated >= this.totalGoodBeansNeeded) {
            this.gameState = 'roast_coffee';
            this.setDialogue("ABUELA: ¡Eso es! Ahora hay que tostar el café en la sartén.");
            this.roastingPan.setAnimation('pan'); // Asegurar que la sartén esté en su estado inicial antes de tostar
        } else if (this.gameState === 'roast_coffee' && this.roastedCoffee) {
            this.gameState = 'final_dialogue_level1';
            this.setDialogue("ABUELOS: ¡Este aroma... lo recordamos bien! ¡El aroma del café!");
            // El libro aparece en una posición específica
            this.recipeBook = new InteractiveObject(500, 150, this.elementsSheet, this.elementAnimations, 'recipe_book'); 
        } else if (this.gameState === 'final_dialogue_level1' && this.dialogueStep >= this.dialogue.length) {
            // Fin del Nivel 1. Puedes añadir una transición al siguiente nivel o un mensaje de fin.
            alert("¡Nivel 1 Completado! ¡Listo para el Nivel 2!");
            // this.game.changeScene('level2'); // Descomentar cuando exista el nivel 2
        }

        // Actualizar todos los objetos interactivos (si tienen animaciones)
        this.coffeeSources.forEach(source => source.update(deltaTime));
        this.sortingStation.update(deltaTime);
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

        // Dibujar objetos interactivos
        this.coffeeSources.forEach(source => source.draw(ctx));
        this.sortingStation.draw(ctx);
        this.roastingPan.draw(ctx);
        if (this.recipeBook) { // Dibujar el libro solo si existe
            this.recipeBook.draw(ctx);
        }
        
        // Dibujar personajes
        this.oldCouple.draw(ctx);
        this.player.draw(ctx);

        // Mostrar el diálogo si hay uno activo
        if (this.dialogueStep < this.dialogue.length) {
            this.showDialogue(ctx, this.dialogue[this.dialogueStep]);
        }
    }

    /**
     * Muestra un cuadro de diálogo con el texto dado.
     * @param {CanvasRenderingContext2D} ctx El contexto de renderizado 2D.
     * @param {string} text El texto a mostrar en el diálogo.
     */
    showDialogue(ctx, text) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Fondo semitransparente para el diálogo
        ctx.fillRect(10, this.game.canvas.height - 70, this.game.canvas.width - 20, 60); // Posición del cuadro de diálogo

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial'; // Tamaño de fuente para el diálogo
        ctx.fillText(text, 20, this.game.canvas.height - 40); // Posición del texto dentro del cuadro
    }

    /**
     * Establece un nuevo diálogo y lo inicia desde el primer paso.
     * Útil para cambiar el diálogo rápidamente según la progresión del juego.
     * @param {string} text El texto del nuevo diálogo (puede ser una cadena o un array de cadenas).
     */
    setDialogue(text) {
        this.dialogue = Array.isArray(text) ? text : [text]; // Acepta string o array
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
                this.resetDialogueTimeout(); // Reiniciar el temporizador para el siguiente paso
            } else {
                clearTimeout(this.dialogueTimeout); // Borrar el temporizador si el diálogo ha terminado
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
     */
    tryCollectCoffee() {
        if (this.gameState === 'collect_coffee') {
            let collectedFromSource = false;
            // Itera sobre cada fuente de café para ver si el jugador está cerca
            this.coffeeSources.forEach(source => {
                if (source.isNear(this.player) && this.collectedBeans < this.maxBeansToCollect) {
                    this.collectedBeans++;
                    collectedFromSource = true;
                    // Opcional: Cambiar el sprite de la fuente después de recoger
                    // Por ejemplo, de 'coffee_bean_red' a 'coffee_bean_green' para simular que ya se recogió.
                    source.setAnimation('coffee_bean_green'); 
                    this.setDialogue(`JUGADOR: ¡He recogido un grano de café rojo! (${this.collectedBeans}/${this.maxBeansToCollect})`);
                }
            });
            
            if (collectedFromSource) {
                if (this.collectedBeans >= this.maxBeansToCollect) {
                    this.setDialogue("ABUELO: ¡Muy bien! Ahora a separar los granos.");
                }
            } else {
                // Mensaje si no hay granos rojos cerca o ya se recogieron
                this.setDialogue("JUGADOR: No hay granos rojos cerca o ya los recogí todos aquí.");
            }
        }
    }

    /**
     * Lógica para intentar separar café. Se activa con un clic.
     */
    trySeparateCoffee() {
        if (this.gameState === 'separate_coffee' && this.sortingStation.isNear(this.player)) {
            // Simulación de separación: cada click cerca de la estación "separa" un grano bueno.
            if (this.goodBeansSeparated < this.totalGoodBeansNeeded) {
                this.goodBeansSeparated++;
                this.setDialogue(`JUGADOR: Separando granos... ¡Listo un grano bueno! (${this.goodBeansSeparated}/${this.totalGoodBeansNeeded})`);
            }
            if (this.goodBeansSeparated >= this.totalGoodBeansNeeded) {
                this.setDialogue("ABUELA: ¡Perfecto! Ahora hay que tostar el café en la sartén.");
            }
        } else if (this.gameState === 'separate_coffee' && !this.sortingStation.isNear(this.player)) {
            this.setDialogue("JUGADOR: Debo ir a la bandeja de separación para hacer esto.");
        }
    }

    /**
     * Lógica para intentar tostar café. Se activa con un clic.
     */
    tryRoastCoffee() {
        if (this.gameState === 'roast_coffee' && this.roastingPan.isNear(this.player)) {
            if (!this.roastedCoffee) {
                this.roastedCoffee = true;
                // Cambia el sprite de la sartén para mostrar el café tostado/la totuma
                this.roastingPan.setAnimation('totuma_roasted_coffee'); 
                this.setDialogue("JUGADOR: El café se está tostando... ¡Qué buen aroma!");
            } else {
                this.setDialogue("JUGADOR: El café ya está tostado.");
            }
        } else if (this.gameState === 'roast_coffee' && !this.roastingPan.isNear(this.player)) {
            this.setDialogue("JUGADOR: Necesito la sartén para tostar el café.");
        }
    }
}