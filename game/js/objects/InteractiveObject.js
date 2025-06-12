class InteractiveObject {
    /**
     * @param {number} x - Posición X inicial del objeto.
     * @param {number} y - Posición Y inicial del objeto.
     * @param {HTMLImageElement} spriteSheet - La imagen de la hoja de sprites.
     * @param {Object} animations - Un objeto que define las animaciones disponibles.
     * Ej: { 'idle': { xOffset: 0, yOffset: 0, frameCount: 1 }, 'blink': { xOffset: 0, yOffset: 0, frameCount: 2 } }
     * @param {string} initialAnimation - El nombre de la animación inicial a usar.
     * @param {number} scale - El factor de escalado para dibujar el objeto.
     */
    constructor(x, y, spriteSheet, animations, initialAnimation = 'default_animation', scale = 1) {
        this.x = x;
        this.y = y;
        this.width = 32; // Ancho predeterminado de un frame del sprite. ¡Ajustar si el sprite es diferente!
        this.height = 32; // Alto predeterminado de un frame del sprite. ¡Ajustar si el sprite es diferente!
        this.scale = scale; 
        this.spriteSheet = spriteSheet;
        this.animations = animations;

        // Establecer la animación inicial
        if (this.animations[initialAnimation]) {
            this.currentAnimation = this.animations[initialAnimation];
        } else {
            console.warn(`Animación inicial "${initialAnimation}" no encontrada para InteractiveObject. Usando animación predeterminada.`);
            this.currentAnimation = { xOffset: 0, yOffset: 0, frameCount: 1 }; // Animación por defecto
        }
        
        this.currentFrameIndex = 0;
        this.frameTimer = 0;
        this.frameDelay = 200; // Velocidad de animación (en ms por frame)
    }

    /**
     * Actualiza el estado del objeto, incluyendo la animación.
     * @param {number} deltaTime - Tiempo transcurrido desde el último frame en milisegundos.
     */
    update(deltaTime) {
        if (this.currentAnimation && this.currentAnimation.frameCount > 1) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.frameDelay) {
                this.currentFrameIndex = (this.currentFrameIndex + 1) % this.currentAnimation.frameCount;
                this.frameTimer = 0;
            }
        }
    }

    /**
     * Dibuja el objeto en el contexto del canvas.
     * @param {CanvasRenderingContext2D} ctx - El contexto de renderizado del canvas.
     */
    draw(ctx) {
        if (!this.currentAnimation || !this.spriteSheet) return;

        // Calcula la posición del frame en la hoja de sprites
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
     * @param {string} animName - El nombre de la animación a establecer.
     */
    setAnimation(animName) {
        if (this.animations[animName]) {
            this.currentAnimation = this.animations[animName];
            this.currentFrameIndex = 0; // Reinicia la animación
            this.frameTimer = 0;
        } else {
            console.warn(`Animación "${animName}" no encontrada para el objeto interactivo.`);
        }
    }

    /**
     * Verifica si un punto (mouseX, mouseY) está dentro del área visible del objeto.
     * @param {number} mouseX - Coordenada X del clic del ratón.
     * @param {number} mouseY - Coordenada Y del clic del ratón.
     * @returns {boolean} - True si el clic está sobre el objeto, false en caso contrario.
     */
    isClicked(mouseX, mouseY) {
        return mouseX >= this.x && mouseX <= this.x + (this.width * this.scale) &&
               mouseY >= this.y && mouseY <= this.y + (this.height * this.scale);
    }
}