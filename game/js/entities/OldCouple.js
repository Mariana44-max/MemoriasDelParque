// game/js/entities/OldCouple.js
class OldCouple {
    constructor(grandmaX, grandmaY, grandpaX, grandpaY) {
        this.grandmaX = grandmaX;
        this.grandmaY = grandmaY;
        this.grandpaX = grandpaX;
        this.grandpaY = grandpaY;
        this.width = 48;
        this.height = 48;

        this.grandmaSprites = {
            stand: assetLoader.getAsset('grandma_stand'),
            walk1: assetLoader.getAsset('grandma_walk1'),
            walk2: assetLoader.getAsset('grandma_walk2')
        };
        this.grandpaSprites = {
            stand: assetLoader.getAsset('grandpa_stand'),
            walk1: assetLoader.getAsset('grandpa_walk1'),
            walk2: assetLoader.getAsset('grandpa_walk2')
        };
    }

    update(deltaTime) {
        // Por ahora, los abuelos no se mueven por sí mismos en la introducción
        // Pero podrías añadir lógica de movimiento si es necesario en otros niveles
    }

    draw(ctx) {
        // Dibujar abuela
        ctx.drawImage(this.grandmaSprites.stand, this.grandmaX, this.grandmaY, this.width, this.height);
        // Dibujar abuelo
        ctx.drawImage(this.grandpaSprites.stand, this.grandpaX, this.grandpaY, this.width, this.height);
    }
}