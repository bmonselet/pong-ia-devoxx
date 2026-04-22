export class Ball {
    private x: number;
    private y: number;
    private vx: number; // vitesse X (px/s)
    private vy: number; // vitesse Y (px/s)
    private radius: number;
    private maxSpeed: number = 700; // vitesse max (px/s)
    private minSpeed: number = 450; // vitesse min (px/s)
    private accelerationFactor: number = 1.05; // +5% à chaque rebond
    private maxSpeedMultiplier: number = 2.0; // Pallier: 2x la vitesse max initiale
    private currentSpeedMultiplier: number = 1.0; // Multiplicateur actuel

    constructor(x: number, y: number, radius: number = 5) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.vx = 0;
        this.vy = 0;
    }

    // Getters
    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    getRadius(): number {
        return this.radius;
    }

    getVelocity(): { vx: number; vy: number } {
        return { vx: this.vx, vy: this.vy };
    }

    getSpeedMultiplier(): number {
        return this.currentSpeedMultiplier;
    }

    getMinSpeed(): number {
        return this.minSpeed;
    }

    getMaxSpeed(): number {
        return this.maxSpeed;
    }

    getAccelerationFactor(): number {
        return this.accelerationFactor;
    }

    getMaxSpeedMultiplier(): number {
        return this.maxSpeedMultiplier;
    }

    // Setters
    setVelocity(vx: number, vy: number): void {
        this.vx = vx;
        this.vy = vy;
    }

    setMinSpeed(speed: number): void {
        this.minSpeed = speed;
    }

    setMaxSpeed(speed: number): void {
        this.maxSpeed = speed;
    }

    setAccelerationFactor(factor: number): void {
        this.accelerationFactor = factor;
    }

    setMaxSpeedMultiplier(multiplier: number): void {
        this.maxSpeedMultiplier = multiplier;
    }

    /**
     * Mettre à jour la position basée sur la vélocité
     * @param delta temps écoulé en millisecondes
     */
    update(delta: number): void {
        const deltaSeconds = delta / 1000; // convertir ms en secondes
        this.x += this.vx * deltaSeconds;
        this.y += this.vy * deltaSeconds;
    }

    /**
     * Réinitialiser la position et la vélocité aléatoire
     * @param x position X initiale
     * @param y position Y initiale
     */
    reset(x: number, y: number): void {
        this.x = x;
        this.y = y;

        // Vitesse aléatoire entre minSpeed et maxSpeed
        const speed = this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed);

        // Direction aléatoire, évitant drastiquement les angles verticaux
        // Plages autorisées: -30° à +30° (vers la droite) ou 150° à 210° (vers la gauche)
        let angle: number;
        const direction = Math.random() > 0.5 ? 1 : -1; // 1 = droite, -1 = gauche

        if (direction > 0) {
            // Vers la droite: -30° à +30° (plus horizontal)
            angle = -30 + Math.random() * 60;
        } else {
            // Vers la gauche: 150° à 210° (plus horizontal)
            angle = 150 + Math.random() * 60;
        }

        const radians = (angle * Math.PI) / 180;
        this.vx = Math.cos(radians) * speed;
        this.vy = Math.sin(radians) * speed;

        // Réinitialiser le multiplicateur de vitesse
        this.currentSpeedMultiplier = 1.0;
    }

    /**
     * Rebond sur les murs haut/bas
     * @param gameHeight hauteur du jeu
     */
    reboundOnWall(gameHeight: number): void {
        // Rebond sur le mur du bas
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.vy = Math.abs(this.vy);
            this.accelerate();
        }

        // Rebond sur le mur du haut
        if (this.y + this.radius >= gameHeight) {
            this.y = gameHeight - this.radius;
            this.vy = -Math.abs(this.vy);
            this.accelerate();
        }
    }

    /**
     * Rebond sur une raquette avec calcul d'angle basé sur le point d'impact
     * @param paddleX position X de la raquette
     * @param paddleY position Y de la raquette
     * @param paddleHeight hauteur de la raquette
     * @param isLeftPaddle true si c'est la raquette de gauche
     */
    reboundOnPaddle(paddleX: number, paddleY: number, paddleHeight: number, isLeftPaddle: boolean): void {
        // Calculer le point d'impact relatif: 0 = bas de la raquette, 1 = haut
        const paddleTop = paddleY;
        const paddleBottom = paddleY + paddleHeight;
        const relativeImpact = (this.y - paddleTop) / paddleHeight;

        // Clamper entre 0 et 1
        const clampedImpact = Math.max(0, Math.min(1, relativeImpact));

        // Calculer l'angle vertical basé sur le point d'impact
        // -60° si le bas de la raquette, +60° si le haut
        const angleRange = 60; // degrés
        const verticalAngle = (clampedImpact - 0.5) * 2 * angleRange;
        const radians = (verticalAngle * Math.PI) / 180;

        // Calculer la nouvelle vélocité
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const newSpeed = Math.max(this.minSpeed, Math.min(this.maxSpeed, currentSpeed));

        // Direction X dépend de la raquette
        const directionX = isLeftPaddle ? 1 : -1;

        // Nouvelle vélocité avec angle calculé
        this.vx = Math.cos(Math.atan2(Math.sin(radians), directionX)) * newSpeed;
        this.vy = Math.sin(radians) * newSpeed;

        // Inverser vx pour diriger vers l'autre côté
        this.vx = Math.abs(this.vx) * directionX;

        // Repositionner la balle légèrement en dehors de la raquette
        if (isLeftPaddle) {
            this.x = paddleX + this.radius + 2;
        } else {
            this.x = paddleX - this.radius - 2;
        }

        // Accélérer après le rebond
        this.accelerate();
    }

    /**
     * Vérifier si la balle est hors des limites horizontales
     * @param gameWidth largeur du jeu
     */
    isOutOfBounds(gameWidth: number): boolean {
        return this.x < 0 || this.x > gameWidth;
    }

    /**
     * Accélérer la balle progressivement jusqu'à un pallier maximal
     * L'accélération est appliquée à chaque rebond (raquette/mur)
     */
    private accelerate(): void {
        // Augmenter le multiplicateur de vitesse de 5%
        this.currentSpeedMultiplier = Math.min(
            this.currentSpeedMultiplier * this.accelerationFactor,
            this.maxSpeedMultiplier
        );

        // Calculer la vitesse actuelle
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        // Appliquer le multiplicateur à la vitesse
        if (currentSpeed > 0) {
            const newSpeed = Math.max(
                this.minSpeed,
                Math.min(this.maxSpeed * this.currentSpeedMultiplier, currentSpeed * this.accelerationFactor)
            );

            // Normaliser et appliquer la nouvelle vitesse
            this.vx = (this.vx / currentSpeed) * newSpeed;
            this.vy = (this.vy / currentSpeed) * newSpeed;
        }
    }

    /**
     * Déterminer qui a marqué un point
     * @returns 'left' si x < 0, 'right' si x > gameWidth, null sinon
     */
    getScored(): 'left' | 'right' | null {
        if (this.x < 0) {
            return 'right'; // Joueur de droite marque
        }
        if (this.x > 10000) {
            // Utiliser une valeur par défaut pour la largeur
            return 'left'; // Joueur de gauche marque
        }
        return null;
    }

    /**
     * Déterminer qui a marqué avec vérification de la largeur du jeu
     * @param gameWidth largeur du jeu
     */
    getScoredWithWidth(gameWidth: number): 'left' | 'right' | null {
        if (this.x < 0) {
            return 'right';
        }
        if (this.x > gameWidth) {
            return 'left';
        }
        return null;
    }
}
