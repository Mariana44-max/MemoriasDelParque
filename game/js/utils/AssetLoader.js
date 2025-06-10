// game/js/utils/AssetLoader.js
class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedAssets = 0;
        this.totalAssets = 0;
    }

    // Carga una imagen y la guarda en el objeto assets
    loadImage(name, src) {
        this.totalAssets++;
        const img = new Image();
        img.src = src;
        img.onload = () => {
            this.loadedAssets++;
        };
        img.onerror = () => {
            console.error(`Error al cargar la imagen: ${src}`);
            this.loadedAssets++; // Asegura que el contador avance incluso con errores
        };
        this.assets[name] = img;
    }

    // Verifica si todos los assets se han cargado
    isReady() {
        return this.loadedAssets === this.totalAssets;
    }

    // Obtiene un asset por su nombre
    getAsset(name) {
        return this.assets[name];
    }
}

// Instancia global del cargador de assets
const assetLoader = new AssetLoader();

// Carga de todos los assets del juego
assetLoader.loadImage('background_intro', 'assets/backgrounds/intro.png');
assetLoader.loadImage('background_coffeFarm', 'assets/backgrounds/coffeFarm.png');
assetLoader.loadImage('overlay_intro', 'assets/extra-elements/intro.png');

// Sprites del jugador
assetLoader.loadImage('player_stand', 'assets/sprites/player/stand.png');
assetLoader.loadImage('player_walk1', 'assets/sprites/player/walk1.png');
assetLoader.loadImage('player_walk2', 'assets/sprites/player/walk2.png');
assetLoader.loadImage('player_interact', 'assets/sprites/player/interact.png');

// Sprites de la abuela
assetLoader.loadImage('grandma_stand', 'assets/sprites/grandma/stand.png');
assetLoader.loadImage('grandma_walk1', 'assets/sprites/grandma/walk1.png');
assetLoader.loadImage('grandma_walk2', 'assets/sprites/grandma/walk2.png');

// Sprites del abuelo
assetLoader.loadImage('grandpa_stand', 'assets/sprites/grandpa/stand.png');
assetLoader.loadImage('grandpa_walk1', 'assets/sprites/grandpa/walk1.png');
assetLoader.loadImage('grandpa_walk2', 'assets/sprites/grandpa/walk2.png');