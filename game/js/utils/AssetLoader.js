// game/js/utils/AssetLoader.js

class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedAssets = 0;
        this.totalAssets = 0;
        this.onReadyCallbacks = []; // Para manejar callbacks de carga completada
    }

    loadImage(name, src) {
        this.totalAssets++;
        const img = new Image();
        img.src = src; // La ruta es relativa a game.html, que está en la misma carpeta que assets/
        img.onload = () => {
            this.loadedAssets++;
            this.checkReady(); // Verificar si todo está cargado al terminar cada carga
        };
        img.onerror = () => {
            console.error(`Error al cargar la imagen: ${src}`);
            this.loadedAssets++; // Asegura que el contador avance incluso con errores
            this.checkReady(); // Verificar incluso si hubo error
        };
        this.assets[name] = img;
    }

    isReady() {
        return this.loadedAssets === this.totalAssets;
    }

    getAsset(name) {
        return this.assets[name];
    }

    // Nuevo método para registrar funciones que se ejecutarán cuando todos los assets estén listos
    onReady(callback) {
        if (this.isReady()) {
            callback(); // Si ya está listo, ejecuta el callback inmediatamente
        } else {
            this.onReadyCallbacks.push(callback); // Si no, lo añade a la cola
        }
    }

    // Nuevo método interno para verificar y ejecutar callbacks
    checkReady() {
        if (this.isReady()) {
            // Ejecuta todos los callbacks registrados y limpia la lista
            this.onReadyCallbacks.forEach(callback => callback());
            this.onReadyCallbacks = []; 
        }
    }
}

const assetLoader = new AssetLoader();

// Carga de fondos y overlay
assetLoader.loadImage('background_intro', 'assets/backgrounds/intro.png');
assetLoader.loadImage('background_coffeFarm', 'assets/backgrounds/coffeFarm.png');
assetLoader.loadImage('background_barn', 'assets/backgrounds/barn.png'); // ¡NUEVO FONDO DEL ESTABLO!
assetLoader.loadImage('overlay_intro', 'assets/extra-elements/intro.png');

// Sprites del JUGADOR
assetLoader.loadImage('player_stand', 'assets/sprites/player/stand.png');
assetLoader.loadImage('player_walk_sheet', 'assets/sprites/player/walk1.png');
assetLoader.loadImage('player_interact', 'assets/sprites/player/Interact.png');

// Sprites de la ABUELA
assetLoader.loadImage('grandma_stand', 'assets/sprites/grandma/stand.png');
assetLoader.loadImage('grandma_walk_sheet', 'assets/sprites/grandma/walk1.png');

// Sprites del ABUELO
assetLoader.loadImage('grandpa_stand', 'assets/sprites/grandpa/stand.png');
assetLoader.loadImage('grandpa_walk_sheet', 'assets/sprites/grandpa/walk1.png');

// Elementos de juego
assetLoader.loadImage('game_elements_sheet', 'assets/extra-elements/game_elements.png'); // Nivel 1
assetLoader.loadImage('horse', 'assets/extra-elements/horse.png'); // ¡NUEVO! Caballo para Nivel 2
assetLoader.loadImage('barn_elements', 'assets/extra-elements/barn_elements.png'); // ¡NUEVO! Elementos para Nivel 2