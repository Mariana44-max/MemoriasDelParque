// game/js/game.js

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scenes = {}; // Almacenará todas las escenas del juego
        this.currentScene = null;
        this.lastFrameTime = 0; // Para calcular deltaTime
        this.animationFrameId = null; // Para controlar requestAnimationFrame
        this.keys = {}; // Para manejar entradas del teclado si las hubiera

        // Configurar el tamaño del canvas (asegúrate de que coincida con game.html)
        this.canvas.width = 512; 
        this.canvas.height = 288;

        // Inicia el proceso de carga de assets y luego el juego
        // assetLoader.loadImage('pixelFont', 'assets/fonts/pixelFont.png'); // Si usas fuentes personalizadas
        // assetLoader.loadImage('pixelFontData', 'assets/fonts/pixelFont.fnt'); 

        assetLoader.onReady(() => this.init()); // Usa el nuevo método onReady
    }

    // Inicializa el juego una vez que todos los assets están cargados
    init() {
        console.log("Todos los assets cargados. Inicializando escenas.");
        this.setupScenes();
        this.changeScene('intro'); // Inicia con la escena de introducción
        this.gameLoop(0); // Inicia el bucle de juego
    }

    // Configura todas las escenas del juego
    setupScenes() {
        this.scenes.intro = new IntroScene(this);
        this.scenes.level1 = new Level1Scene(this);
        this.scenes.level2 = new Level2Scene(this); // ¡Añadimos Level2Scene aquí!
        // this.scenes.level3 = new Level3Scene(this); // Para cuando crees el nivel 3
    }

    // Cambia la escena actual
    changeScene(sceneName) {
        if (this.currentScene && typeof this.currentScene.destroy === 'function') {
            this.currentScene.destroy(); // Limpia la escena anterior (ej. listeners de eventos)
        }
        this.currentScene = this.scenes[sceneName];
        if (this.currentScene && typeof this.currentScene.init === 'function') {
            this.currentScene.init(); // Inicializa la nueva escena
            console.log(`Cambiando a la escena: ${sceneName}`);
        } else {
            console.error(`La escena "${sceneName}" no existe o no tiene método init().`);
        }
    }

    // Bucle principal del juego
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.currentScene) {
            this.currentScene.update(deltaTime);
            this.currentScene.draw(this.ctx);
        }

        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    // Puedes añadir métodos para el manejo de teclas si lo necesitas
    // handleKeyDown(event) { this.keys[event.code] = true; }
    // handleKeyUp(event) { this.keys[event.code] = false; }
}

// Inicia el juego una vez que el DOM esté completamente cargado
window.onload = () => {
    const game = new Game();
};