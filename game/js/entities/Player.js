class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 64; // Tamaño final en el canvas (escalado de 32x32)
        this.height = 64;
        this.spriteWidth = 32; // Ancho original de un frame en la sprite sheet
        this.spriteHeight = 32; // Alto original de un frame en la sprite sheet
        this.speed = 1;
        this.currentAction = 'walking'; // 'walking', 'standing', 'interacting'
        this.currentDirection = 'right'; // 'down', 'left', 'right', 'up'
        this.currentFrameIndex = 0; // Índice del frame actual dentro de la animación
        this.frameTimer = 0;
        this.frameDelay = 100; // Milisegundos entre frames de animación (10 FPS)

        // Carga de los sprites individuales y la hoja de caminar
        this.standSprite = assetLoader.getAsset('player_stand');
        this.interactSprite = assetLoader.getAsset('player_interact');
        this.walkSheet = assetLoader.getAsset('player_walk_sheet');

        // Definición de las animaciones dentro de la sprite sheet de caminar (walk1.png)
        // xOffset es siempre 0 porque la animación empieza en la primera columna de cada fila.
        // yOffset es el índice de la fila (0 para abajo, 1 para izquierda, etc.)
        // frameCount es 3 para todas las animaciones de caminar.
        this.walkAnimations = {
            'down':  { yOffset: 0, frameCount: 3 },
            'left':  { yOffset: 1, frameCount: 3 },
            'right': { yOffset: 2, frameCount: 3 },
            'up':    { yOffset: 3, frameCount: 3 }
        };
    }

    update(deltaTime) {
        if (this.currentAction === 'walking') {
            this.x += this.speed; // Solo mueve en X para la introducción
            this.currentDirection = 'right'; // Fija la dirección para la animación de caminar de la intro

            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameDelay) {
                // Avanza al siguiente frame de la animación de caminar de la dirección actual
                const anim = this.walkAnimations[this.currentDirection];
                this.currentFrameIndex = (this.currentFrameIndex + 1) % anim.frameCount;
                this.frameTimer = 0;
            }
        } else if (this.currentAction === 'standing' || this.currentAction === 'interacting') {
            this.currentFrameIndex = 0; // Para estas acciones, el frame index es 0 o no se usa
        }
    }

    draw(ctx) {
        let spriteToDraw;
        let sourceX = 0;
        let sourceY = 0;

        if (this.currentAction === 'standing') {
            spriteToDraw = this.standSprite;
            // Para sprites individuales, no hay recorte específico, se dibuja la imagen completa (sx=0, sy=0)
        } else if (this.currentAction === 'interacting') {
            spriteToDraw = this.interactSprite;
            // Similar, imagen completa
        } else if (this.currentAction === 'walking') {
            spriteToDraw = this.walkSheet;
            const anim = this.walkAnimations[this.currentDirection];
            sourceX = this.currentFrameIndex * this.spriteWidth;
            sourceY = anim.yOffset * this.spriteHeight;
        }

        ctx.drawImage(
            spriteToDraw,
            sourceX,             // sx: Posición X de recorte en la imagen fuente
            sourceY,             // sy: Posición Y de recorte en la imagen fuente
            this.spriteWidth,    // sWidth: Ancho del recorte (un solo frame)
            this.spriteHeight,   // sHeight: Alto del recorte (un solo frame)
            this.x,              // dx: Posición X de destino en el canvas
            this.y,              // dy: Posición Y de destino en el canvas
            this.width,          // dWidth: Ancho final de la imagen en el canvas
            this.height          // dHeight: Alto final de la imagen en el canvas
        );
    }

    // Métodos para cambiar el estado del jugador
    startWalking(direction = 'right') {
        this.currentAction = 'walking';
        this.currentDirection = direction;
        this.currentFrameIndex = 0;
    }

    stopMoving() {
        this.currentAction = 'standing';
        this.currentFrameIndex = 0;
    }

    startInteracting() {
        this.currentAction = 'interacting';
        this.currentFrameIndex = 0;
    }
}