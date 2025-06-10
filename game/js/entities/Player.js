// game/js/entities/Player.js
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 48; // Tamaño en el canvas
        this.height = 48;
        this.speed = 1;
        this.isMoving = false;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.frameDelay = 100; // Milisegundos entre frames de animación
        this.direction = 'right'; // o 'left', 'up', 'down' si lo necesitas

        this.sprites = {
            stand: assetLoader.getAsset('player_stand'),
            walk1: assetLoader.getAsset('player_walk1'),
            walk2: assetLoader.getAsset('player_walk2'),
            interact: assetLoader.getAsset('player_interact')
        };
    }

    update(deltaTime) {
        if (this.isMoving) {
            this.x += this.speed;

            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameDelay) {
                this.currentFrame = (this.currentFrame + 1) % 2; // Asume 2 frames para caminar (walk1, walk2)
                this.frameTimer = 0;
            }
        } else {
            this.currentFrame = 0; // Vuelve al frame de stand
        }
    }

    draw(ctx) {
        let spriteToDraw;
        if (this.isMoving) {
            spriteToDraw = this.currentFrame === 0 ? this.sprites.walk1 : this.sprites.walk2;
        } else {
            spriteToDraw = this.sprites.stand;
        }

        // Si tu sprite sheet tiene más de un frame en una fila, tendrías que ajustar el recorte aquí
        // Por ahora, asumimos que cada 'walk1.png', 'walk2.png' etc. es una imagen completa de un frame
        ctx.drawImage(spriteToDraw, this.x, this.y, this.width, this.height);
    }

    // Métodos para controlar el movimiento
    startMoving() {
        this.isMoving = true;
    }

    stopMoving() {
        this.isMoving = false;
    }
}