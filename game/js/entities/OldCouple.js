class OldCouple {
    constructor(grandmaX, grandmaY, grandpaX, grandpaY) {
        this.grandmaX = grandmaX;
        this.grandmaY = grandmaY;
        this.grandpaX = grandpaX;
        this.grandpaY = grandpaY;
        this.width = 64;
        this.height = 64;
        this.spriteWidth = 32;
        this.spriteHeight = 32;

        // Carga de los sprites individuales y la hoja de caminar
        this.grandmaStandSprite = assetLoader.getAsset('grandma_stand');
        this.grandmaWalkSheet = assetLoader.getAsset('grandma_walk_sheet');

        this.grandpaStandSprite = assetLoader.getAsset('grandpa_stand');
        this.grandpaWalkSheet = assetLoader.getAsset('grandpa_walk_sheet');

        // Definición de las animaciones de caminar en sus respectivas sheets
        this.walkAnimations = {
            'down':  { yOffset: 0, frameCount: 3 },
            'left':  { yOffset: 1, frameCount: 3 },
            'right': { yOffset: 2, frameCount: 3 },
            'up':    { yOffset: 3, frameCount: 3 }
            // Ignoramos la fila 4 por ahora si no tiene un uso definido
        };

        this.grandmaCurrentAction = 'standing'; // 'standing', 'walking'
        this.grandpaCurrentAction = 'standing'; // 'standing', 'walking'
        this.grandmaCurrentDirection = 'down'; // Suponemos que miran hacia abajo en la intro
        this.grandpaCurrentDirection = 'down';

        this.grandmaCurrentFrameIndex = 0;
        this.grandpaCurrentFrameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 100;
    }

    update(deltaTime) {
        // Lógica de movimiento y animación para abuelos si la necesitas.
        // Por ahora, en la intro, ellos están estáticos.
        if (this.grandmaCurrentAction === 'walking' || this.grandpaCurrentAction === 'walking') {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameDelay) {
                // Si la abuela está caminando
                if (this.grandmaCurrentAction === 'walking') {
                    const anim = this.walkAnimations[this.grandmaCurrentDirection];
                    this.grandmaCurrentFrameIndex = (this.grandmaCurrentFrameIndex + 1) % anim.frameCount;
                }
                // Si el abuelo está caminando
                if (this.grandpaCurrentAction === 'walking') {
                    const anim = this.walkAnimations[this.grandpaCurrentDirection];
                    this.grandpaCurrentFrameIndex = (this.grandpaCurrentFrameIndex + 1) % anim.frameCount;
                }
                this.frameTimer = 0;
            }
        } else {
            this.grandmaCurrentFrameIndex = 0; // Resetear al primer frame si no están caminando
            this.grandpaCurrentFrameIndex = 0;
        }
    }

    draw(ctx) {
        // Dibujar abuela
        let grandmaSpriteToDraw = this.grandmaStandSprite; // Default: stand
        let grandmaSourceX = 0;
        let grandmaSourceY = 0;

        if (this.grandmaCurrentAction === 'walking') {
            grandmaSpriteToDraw = this.grandmaWalkSheet;
            const anim = this.walkAnimations[this.grandmaCurrentDirection];
            grandmaSourceX = this.grandmaCurrentFrameIndex * this.spriteWidth;
            grandmaSourceY = anim.yOffset * this.spriteHeight;
        }

        ctx.drawImage(
            grandmaSpriteToDraw,
            grandmaSourceX,
            grandmaSourceY,
            this.spriteWidth,
            this.spriteHeight,
            this.grandmaX,
            this.grandmaY,
            this.width,
            this.height
        );

        // Dibujar abuelo
        let grandpaSpriteToDraw = this.grandpaStandSprite; // Default: stand
        let grandpaSourceX = 0;
        let grandpaSourceY = 0;

        if (this.grandpaCurrentAction === 'walking') {
            grandpaSpriteToDraw = this.grandpaWalkSheet;
            const anim = this.walkAnimations[this.grandpaCurrentDirection];
            grandpaSourceX = this.grandpaCurrentFrameIndex * this.spriteWidth;
            grandpaSourceY = anim.yOffset * this.spriteHeight;
        }

        ctx.drawImage(
            grandpaSpriteToDraw,
            grandpaSourceX,
            grandpaSourceY,
            this.spriteWidth,
            this.spriteHeight,
            this.grandpaX,
            this.grandpaY,
            this.width,
            this.height
        );
    }

    // Métodos para controlar el estado de los abuelos
    startWalking(direction = 'down') { // Por defecto hacia abajo, pueden cambiarlo
        this.grandmaCurrentAction = 'walking';
        this.grandpaCurrentAction = 'walking';
        this.grandmaCurrentDirection = direction;
        this.grandpaCurrentDirection = direction;
        this.grandmaCurrentFrameIndex = 0;
        this.grandpaCurrentFrameIndex = 0;
    }

    stopMoving() {
        this.grandmaCurrentAction = 'standing';
        this.grandpaCurrentAction = 'standing';
        this.grandmaCurrentFrameIndex = 0;
        this.grandpaCurrentFrameIndex = 0;
    }
}