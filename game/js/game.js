class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scenes = {}; // Almacenará todas las escenas del juego
        this.currentScene = null;
        this.lastFrameTime = 0; // Para calcular deltaTime
        this.animationFrameId = null; // Para controlar requestAnimationFrame
        this.keys = {};
    }

    // Inicializa el juego
    init() {
        // Espera a que todos los assets se carguen
        const checkAssets = () => {
            if (assetLoader.isReady()) {
                console.log("Todos los assets cargados. Inicializando escenas.");
                this.setupScenes();
                this.changeScene('intro'); // Inicia con la escena de introducción
                this.gameLoop(0); // Inicia el bucle de juego
            } else {
                console.log(`Cargando assets... ${assetLoader.loadedAssets}/${assetLoader.totalAssets}`);
                requestAnimationFrame(checkAssets);
            }
        };
        requestAnimationFrame(checkAssets);
    }

    // Configura todas las escenas del juego
    setupScenes() {
        this.scenes.intro = new IntroScene(this);
        this.scenes.level1 = new Level1Scene(this);
    }

    // Cambia la escena actual
    changeScene(sceneName) {
        if (this.currentScene) {
            this.currentScene.destroy(); // Limpia la escena anterior
        }
        this.currentScene = this.scenes[sceneName];
        if (this.currentScene) {
            this.currentScene.init(); // Inicializa la nueva escena
            console.log(`Cambiando a la escena: ${sceneName}`);
        } else {
            console.error(`La escena "${sceneName}" no existe.`);
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
}

// Iniciar el juego cuando el DOM esté completamente cargado
window.onload = () => {
    const game = new Game();
    game.init();
};