class InteractiveObject {
    constructor(x, y, spriteSheet, animations, initialAnimation = 'default_animation', scale = 1.5) {
        this.x = x;
        this.y = y;
        this.width = 32; // Ancho original de un frame del sprite
        this.height = 32; // Alto original de un frame del sprite
        this.scale = scale; // Factor de escalado para dibujar en el canvas (32*scale)
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
        if (!this.currentAnimation || !this.spriteSheet) return;

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
     * Comprueba si un punto (ej. el clic del mouse) está dentro del área del objeto.
     * @param {number} mouseX Coordenada X del mouse.
     * @param {number} mouseY Coordenada Y del mouse.
     * @returns {boolean} Verdadero si el punto está dentro del objeto, falso en caso contrario.
     */
    isClicked(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + (this.width * this.scale) &&
               mouseY >= this.y && mouseY <= this.y + (this.height * this.scale);
    }
}