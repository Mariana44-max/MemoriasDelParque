class AssetLoader {
    constructor() {
        this.assets = {};
        this.loadedAssets = 0;
        this.totalAssets = 0;
    }

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

    isReady() {
        return this.loadedAssets === this.totalAssets;
    }

    getAsset(name) {
        return this.assets[name];
    }
}

const assetLoader = new AssetLoader();

// Carga de fondos y overlay
assetLoader.loadImage('background_intro', 'assets/backgrounds/intro.png');
assetLoader.loadImage('background_coffeFarm', 'assets/backgrounds/coffeFarm.png');
assetLoader.loadImage('overlay_intro', 'assets/extra-elements/intro.png');

// Sprites del JUGADOR
assetLoader.loadImage('player_stand', 'assets/sprites/player/stand.png');
assetLoader.loadImage('player_walk_sheet', 'assets/sprites/player/walk1.png'); // La hoja de sprites de caminar
assetLoader.loadImage('player_interact', 'assets/sprites/player/Interact.png'); // Nota: mayúscula en Interact.png

// Sprites de la ABUELA
assetLoader.loadImage('grandma_stand', 'assets/sprites/grandma/stand.png');
assetLoader.loadImage('grandma_walk_sheet', 'assets/sprites/grandma/walk1.png'); // La hoja de sprites de caminar

// Sprites del ABUELO
assetLoader.loadImage('grandpa_stand', 'assets/sprites/grandpa/stand.png');
assetLoader.loadImage('grandpa_walk_sheet', 'assets/sprites/grandpa/walk1.png'); // La hoja de sprites de caminar