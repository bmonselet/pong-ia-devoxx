import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * PongScene: Main game scene for Pong
 * 
 * Controls:
 * - ArrowUp: Move player paddle up
 * - ArrowDown: Move player paddle down
 */
export class PongScene extends Scene {
    private joueurScore: number = 0;
    private iaScore: number = 0;
    private difficulty: DifficultyLevel = 'medium';
    private aiReactionDelay: number = 0;
    private isMultiplayer: boolean = false;
    private angleRangeMin: number = -30;
    private angleRangeMax: number = 30;

    // Spin properties
    private ballSpin: number = 0;
    private ballRotation: number = 0;
    private spinDecay: number = 0.98;
    private maxSpin: number = 15;
    private spinInfluence: number = 0.3;

    private ball: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
    };

    private joueurPaddle: {
        y: number;
        x: number;
        width: number;
        height: number;
    };

    private iaPaddle: {
        y: number;
        x: number;
        width: number;
        height: number;
    };

    private ballGraphics: Phaser.GameObjects.Graphics;
    private joueurGraphics: Phaser.GameObjects.Graphics;
    private iaGraphics: Phaser.GameObjects.Graphics;
    private scoreText: Phaser.GameObjects.Text;

    private gameWidth: number = 800;
    private gameHeight: number = 600;
    private paddleWidth: number = 10;
    private paddleHeight: number = 100;
    private ballRadius: number = 5;
    private ballSpeed: number = 200;
    private paddleSpeed: number = 300;

    private keys: { [key: string]: boolean } = {};
    private aiErrorMargin: number = 40;
    private aiMissRate: number = 0.10;
    private aiController: { update: (time: number, deltaSeconds: number) => void } | null = null;

    // Power-ups
    private powerUps: Array<{
        x: number;
        y: number;
        type: 'speed' | 'slow' | 'bigPaddle' | 'smallPaddle' | 'multiBall';
        color: number;
        radius: number;
        active: boolean;
    }> = [];
    private powerUpGraphics: Phaser.GameObjects.Graphics;
    private powerUpTimer: number = 0;
    private powerUpSpawnInterval: number = 5000;
    private activePowerUps: Array<{
        type: string;
        expiresAt: number;
        target?: 'joueur' | 'ia';
    }> = [];
    private extraBalls: Array<{
        x: number; y: number; vx: number; vy: number; radius: number;
    }> = [];
    private extraBallGraphics: Phaser.GameObjects.Graphics;
    private defaultPaddleHeight: number;
    private defaultBallSpeed: number;
    private lastPaddleHit: 'joueur' | 'ia' = 'joueur';
    private powerUpLabelGraphics: Phaser.GameObjects.Text[] = [];

    constructor() {
        super({ key: 'PongScene' });
    }

    create() {
        // Set background color to black
        this.cameras.main.setBackgroundColor(0x000000);

        // Initialize paddles
        this.joueurPaddle = {
            x: 20,
            y: this.gameHeight / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
        };

        this.iaPaddle = {
            x: this.gameWidth - 20 - this.paddleWidth,
            y: this.gameHeight / 2 - this.paddleHeight / 2,
            width: this.paddleWidth,
            height: this.paddleHeight,
        };

        // Initialize ball with random direction
        const angle = Math.random() * Math.PI * 2;
        this.ball = {
            x: this.gameWidth / 2,
            y: this.gameHeight / 2,
            vx: Math.cos(angle) * this.ballSpeed,
            vy: Math.sin(angle) * this.ballSpeed,
            radius: this.ballRadius,
        };

        // Create graphics objects for rendering
        this.joueurGraphics = this.add.graphics();
        this.iaGraphics = this.add.graphics();
        this.ballGraphics = this.add.graphics();
        this.powerUpGraphics = this.add.graphics();
        this.extraBallGraphics = this.add.graphics();
        this.defaultPaddleHeight = this.paddleHeight;
        this.defaultBallSpeed = this.ballSpeed;

        // Draw border lines (top and bottom)
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(2, 0xffffff, 1);
        borderGraphics.lineBetween(0, 10, this.gameWidth, 10);
        borderGraphics.lineBetween(0, this.gameHeight - 10, this.gameWidth, this.gameHeight - 10);

        // Draw center line (dashed)
        borderGraphics.lineStyle(1, 0xffffff, 0.5);
        for (let y = 0; y < this.gameHeight; y += 20) {
            borderGraphics.lineBetween(this.gameWidth / 2, y, this.gameWidth / 2, y + 10);
        }

        // Score display
        this.scoreText = this.add.text(this.gameWidth / 2, 30, `${this.joueurScore} - ${this.iaScore}`, {
            fontFamily: 'Arial',
            fontSize: '32',
            color: '#ffffff',
            align: 'center',
        }).setOrigin(0.5);

        // Setup keyboard controls
        this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            this.keys[key] = true;
            if (['arrowup', 'arrowdown', 's', 'z'].includes(key)) {
                event.preventDefault();
            }
        });

        this.input.keyboard.on('keyup', (event: KeyboardEvent) => {
            this.keys[event.key.toLowerCase()] = false;
        });

        // Listen for difficulty changes from React
        EventBus.on('difficulty-changed', (newDifficulty: DifficultyLevel) => {
            this.setDifficulty(newDifficulty);
        });

        // Listen for reset-game events from React
        this.events.on('reset-game', () => {
            this.resetGame();
        });

        // Listen for multiplayer mode toggle
        EventBus.on('toggle-multiplayer', (enable: boolean) => {
            this.isMultiplayer = enable;
            this.resetGame();
        });

        // Listen for ball params updates from debug panel
        EventBus.on('update-ball-params', (params: any) => {
            this.ballSpeed = params.minSpeed;
            this.angleRangeMin = params.angleRangeMin;
            this.angleRangeMax = params.angleRangeMax;
            if (params.spinInfluence !== undefined) this.spinInfluence = params.spinInfluence;
            if (params.spinDecay !== undefined) this.spinDecay = params.spinDecay;
        });

        // Draw initial game elements
        this.drawPaddles();
        this.drawBall();

        // Initialize difficulty
        this.setDifficulty(this.difficulty);

        // Initialize AI controller
        this.aiController = {
            update: this.updateAIPaddle.bind(this),
        };

        // Emit ready event
        EventBus.emit('current-scene-ready', this);
    }

    private setDifficulty(difficulty: DifficultyLevel) {
        this.difficulty = difficulty;
        const config = {
            easy: { reactionDelay: 400, errorMargin: 80, missRate: 0.30 },
            medium: { reactionDelay: 150, errorMargin: 40, missRate: 0.10 },
            hard: { reactionDelay: 25, errorMargin: 10, missRate: 0.05 },
        };
        const settings = config[difficulty];
        this.aiReactionDelay = settings.reactionDelay;
        this.aiErrorMargin = settings.errorMargin;
        this.aiMissRate = settings.missRate;
    }

    private resetGame() {
        this.joueurScore = 0;
        this.iaScore = 0;
        this.resetBall();
        this.updateScore();

        // Reset power-ups
        this.powerUps = [];
        this.activePowerUps = [];
        this.extraBalls = [];
        this.powerUpTimer = 0;
        this.ballSpeed = this.defaultBallSpeed;
        this.paddleHeight = this.defaultPaddleHeight;
        this.joueurPaddle.height = this.defaultPaddleHeight;
        this.iaPaddle.height = this.defaultPaddleHeight;
        this.clearPowerUpLabels();
    }

    update(time: number, delta: number) {
        const deltaSeconds = delta / 1000;

        // Handle keyboard input for player 1 (left paddle)
        if (this.keys['arrowup']) {
            const newY = this.joueurPaddle.y - this.paddleSpeed * deltaSeconds;
            this.joueurPaddle.y = Math.max(10, newY);
        } else if (this.keys['arrowdown']) {
            const newY = this.joueurPaddle.y + this.paddleSpeed * deltaSeconds;
            this.joueurPaddle.y = Math.min(this.gameHeight - 10 - this.paddleHeight, newY);
        }

        // Handle right paddle: AI or Player 2 (multiplayer)
        if (this.isMultiplayer) {
            if (this.keys['z']) {
                const newY = this.iaPaddle.y - this.paddleSpeed * deltaSeconds;
                this.iaPaddle.y = Math.max(10, newY);
            } else if (this.keys['s']) {
                const newY = this.iaPaddle.y + this.paddleSpeed * deltaSeconds;
                this.iaPaddle.y = Math.min(this.gameHeight - 10 - this.paddleHeight, newY);
            }
        } else {
            // AI paddle control
            this.updateAIPaddle(time, deltaSeconds);
        }

        // Update ball position
        this.ball.x += this.ball.vx * deltaSeconds;
        this.ball.y += this.ball.vy * deltaSeconds;

        // Apply spin curve effect on trajectory
        if (Math.abs(this.ballSpin) > 0.1) {
            this.ball.vy += this.ballSpin * this.spinInfluence * deltaSeconds * 60;
        }

        // Spin decay
        this.ballSpin *= this.spinDecay;

        // Update visual rotation
        this.ballRotation += this.ballSpin * deltaSeconds;

        // Bounce off top and bottom walls
        if (this.ball.y - this.ball.radius < 10) {
            this.ball.y = 10 + this.ball.radius;
            this.ball.vy = -this.ball.vy;
            this.ballSpin *= -0.5;
        }
        if (this.ball.y + this.ball.radius > this.gameHeight - 10) {
            this.ball.y = this.gameHeight - 10 - this.ball.radius;
            this.ball.vy = -this.ball.vy;
            this.ballSpin *= -0.5;
        }

        // Check scoring (ball exits left or right)
        if (this.ball.x - this.ball.radius < 0) {
            // Right player (IA or Player 2) scores
            this.iaScore++;
            this.resetBall();
            this.updateScore();
        }
        if (this.ball.x + this.ball.radius > this.gameWidth) {
            // Left player scores
            this.joueurScore++;
            this.resetBall();
            this.updateScore();
        }

        // Basic paddle-ball collision detection
        this.checkPaddleCollision(this.joueurPaddle);
        this.checkPaddleCollision(this.iaPaddle);

        // Spawn power-ups periodically
        this.powerUpTimer += delta;
        if (this.powerUpTimer >= this.powerUpSpawnInterval && this.powerUps.length < 3) {
            this.spawnPowerUp();
            this.powerUpTimer = 0;
        }

        // Check ball-powerup collisions
        this.checkPowerUpCollisions();

        // Update extra balls (multi-ball)
        this.updateExtraBalls(deltaSeconds);

        // Check expired power-ups
        this.checkExpiredPowerUps(time);

        // Redraw game elements
        this.drawPaddles();
        this.drawBall();
        this.drawPowerUps(time);
        this.drawExtraBalls();
    }

    private updateAIPaddle(time: number, deltaSeconds: number) {
        // Simple AI with reaction time and error margin
        if (!this.aiReactionDelay) {
            this.setDifficulty(this.difficulty);
        }

        // Check if AI should miss (based on miss rate)
        if (Math.random() < this.aiMissRate) {
            // Don't move - intentional miss
            return;
        }

        // Calculate target position with error margin
        let targetY = this.ball.y - this.paddleHeight / 2;
        targetY += (Math.random() - 0.5) * 2 * this.aiErrorMargin;
        targetY = Math.max(10, Math.min(this.gameHeight - 10 - this.paddleHeight, targetY));

        // Move AI paddle towards target
        const aiCenter = this.iaPaddle.y + this.paddleHeight / 2;
        const threshold = 5;

        if (aiCenter < targetY - threshold) {
            this.iaPaddle.y += this.paddleSpeed * deltaSeconds;
        } else if (aiCenter > targetY + threshold) {
            this.iaPaddle.y -= this.paddleSpeed * deltaSeconds;
        }

        // Clamp paddle position
        this.iaPaddle.y = Math.max(10, Math.min(this.gameHeight - 10 - this.paddleHeight, this.iaPaddle.y));
    }

    private checkPaddleCollision(paddle: any) {
        const ballLeft = this.ball.x - this.ball.radius;
        const ballRight = this.ball.x + this.ball.radius;
        const ballTop = this.ball.y - this.ball.radius;
        const ballBottom = this.ball.y + this.ball.radius;

        const paddleLeft = paddle.x;
        const paddleRight = paddle.x + paddle.width;
        const paddleTop = paddle.y;
        const paddleBottom = paddle.y + paddle.height;

        // Check if ball intersects with paddle
        if (
            ballRight > paddleLeft &&
            ballLeft < paddleRight &&
            ballBottom > paddleTop &&
            ballTop < paddleBottom
        ) {
            // Reflect ball horizontally
            if (this.ball.vx > 0 && paddle === this.iaPaddle) {
                // Ball coming from left, hitting right paddle
                this.ball.vx = -this.ball.vx;
                this.ball.x = paddleLeft - this.ball.radius;
                this.lastPaddleHit = 'ia';
            } else if (this.ball.vx < 0 && paddle === this.joueurPaddle) {
                // Ball coming from right, hitting left paddle
                this.ball.vx = -this.ball.vx;
                this.ball.x = paddleRight + this.ball.radius;
                this.lastPaddleHit = 'joueur';
            }

            // Add some vertical spin based on where ball hit paddle
            const paddleCenterY = paddle.y + paddle.height / 2;
            const relativeIntersectY = paddleCenterY - this.ball.y;
            const bounceAngle = (relativeIntersectY / (paddle.height / 2)) * 0.3; // Max 30 degrees
            this.ball.vy += bounceAngle * Math.abs(this.ball.vx) * 0.5;

            // Calculate spin based on impact position
            const relativeHit = (this.ball.y - paddle.y) / paddle.height; // 0 (top) to 1 (bottom)
            const spinFromPosition = (relativeHit - 0.5) * 2; // -1 to +1

            // Calculate spin based on paddle movement
            let paddleVelocity = 0;
            if (paddle === this.joueurPaddle) {
                if (this.keys['arrowup']) paddleVelocity = -1;
                if (this.keys['arrowdown']) paddleVelocity = 1;
            } else if (this.isMultiplayer) {
                if (this.keys['z']) paddleVelocity = -1;
                if (this.keys['s']) paddleVelocity = 1;
            }

            // Combine both factors
            this.ballSpin = (spinFromPosition * 5 + paddleVelocity * 8);
            this.ballSpin = Math.max(-this.maxSpin, Math.min(this.maxSpin, this.ballSpin));
        }
    }

    private resetBall() {
        // Reset ball to center with random direction
        this.ball.x = this.gameWidth / 2;
        this.ball.y = this.gameHeight / 2;
        this.ballSpin = 0;
        this.ballRotation = 0;

        // Use angle ranges from debug panel
        let angle: number;
        const direction = Math.random() > 0.5 ? 1 : -1; // 1 = right, -1 = left

        if (direction > 0) {
            // Towards right: use angleRangeMin to angleRangeMax
            angle = this.angleRangeMin + Math.random() * (this.angleRangeMax - this.angleRangeMin);
        } else {
            // Towards left: mirror the angles (180 - angle)
            angle = 180 - (this.angleRangeMin + Math.random() * (this.angleRangeMax - this.angleRangeMin));
        }

        const radians = (angle * Math.PI) / 180;
        this.ball.vx = Math.cos(radians) * this.ballSpeed;
        this.ball.vy = Math.sin(radians) * this.ballSpeed;
    }

    private updateScore() {
        this.scoreText.setText(`${this.joueurScore} - ${this.iaScore}`);
        EventBus.emit('score-update', {
            joueur: this.joueurScore,
            ia: this.iaScore,
        });
    }

    private drawPaddles() {
        // Draw joueur paddle (left)
        this.joueurGraphics.clear();
        this.joueurGraphics.fillStyle(0xffffff, 1);
        this.joueurGraphics.fillRect(
            this.joueurPaddle.x,
            this.joueurPaddle.y,
            this.joueurPaddle.width,
            this.joueurPaddle.height
        );

        // Draw IA paddle (right)
        this.iaGraphics.clear();
        this.iaGraphics.fillStyle(0xffffff, 1);
        this.iaGraphics.fillRect(
            this.iaPaddle.x,
            this.iaPaddle.y,
            this.iaPaddle.width,
            this.iaPaddle.height
        );
    }

    private drawBall() {
        this.ballGraphics.clear();

        const spinIntensity = Math.min(Math.abs(this.ballSpin) / this.maxSpin, 1);

        // Main circle
        this.ballGraphics.fillStyle(0xffffff, 1);
        this.ballGraphics.fillCircle(this.ball.x, this.ball.y, this.ball.radius);

        // Spin indicator (rotating line)
        if (Math.abs(this.ballSpin) > 0.5) {
            const lineLength = this.ball.radius * 0.8;
            const endX = this.ball.x + Math.cos(this.ballRotation) * lineLength;
            const endY = this.ball.y + Math.sin(this.ballRotation) * lineLength;
            const spinColor = this.ballSpin > 0 ? 0xff6600 : 0x0066ff;
            this.ballGraphics.lineStyle(2, spinColor, spinIntensity);
            this.ballGraphics.lineBetween(this.ball.x, this.ball.y, endX, endY);
        }

        // Trail effect
        const trailLength = 3;
        for (let i = 1; i <= trailLength; i++) {
            const trailX = this.ball.x - this.ball.vx * 0.01 * i;
            const trailY = this.ball.y - this.ball.vy * 0.01 * i;
            const alpha = 0.3 - (i * 0.1);
            if (alpha > 0) {
                this.ballGraphics.fillStyle(0xffffff, alpha);
                this.ballGraphics.fillCircle(trailX, trailY, this.ball.radius * (1 - i * 0.2));
            }
        }
    }

    // ===================== Power-Up System =====================

    private spawnPowerUp() {
        const types = ['speed', 'slow', 'bigPaddle', 'smallPaddle', 'multiBall'] as const;
        const colors: Record<string, number> = {
            speed: 0xff0000, slow: 0x00ff00, bigPaddle: 0x0088ff,
            smallPaddle: 0xffff00, multiBall: 0xff00ff,
        };
        const type = types[Math.floor(Math.random() * types.length)];

        this.powerUps.push({
            x: 200 + Math.random() * 400,
            y: 50 + Math.random() * 500,
            type,
            color: colors[type],
            radius: 12,
            active: true,
        });
    }

    private checkPowerUpCollisions() {
        const checkBallAgainstPowerUps = (bx: number, by: number, br: number) => {
            for (let i = this.powerUps.length - 1; i >= 0; i--) {
                const pu = this.powerUps[i];
                if (!pu.active) continue;
                const dx = bx - pu.x;
                const dy = by - pu.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < br + pu.radius) {
                    this.activatePowerUp(pu.type);
                    this.powerUps.splice(i, 1);
                }
            }
        };

        checkBallAgainstPowerUps(this.ball.x, this.ball.y, this.ball.radius);
        for (const eb of this.extraBalls) {
            checkBallAgainstPowerUps(eb.x, eb.y, eb.radius);
        }
    }

    private activatePowerUp(type: 'speed' | 'slow' | 'bigPaddle' | 'smallPaddle' | 'multiBall') {
        const now = this.time.now;
        const labels: Record<string, string> = {
            speed: '🔴 Speed Boost!', slow: '🟢 Slow Motion!',
            bigPaddle: '🔵 Big Paddle!', smallPaddle: '🟡 Small Paddle!',
            multiBall: '🟣 Multi Ball!',
        };

        switch (type) {
            case 'speed': {
                this.ball.vx *= 1.5;
                this.ball.vy *= 1.5;
                this.activePowerUps.push({ type, expiresAt: now + 5000 });
                break;
            }
            case 'slow': {
                this.ball.vx *= 0.5;
                this.ball.vy *= 0.5;
                this.activePowerUps.push({ type, expiresAt: now + 5000 });
                break;
            }
            case 'bigPaddle': {
                const target = this.lastPaddleHit;
                const paddle = target === 'joueur' ? this.joueurPaddle : this.iaPaddle;
                paddle.height = this.defaultPaddleHeight * 1.5;
                this.activePowerUps.push({ type, expiresAt: now + 8000, target });
                break;
            }
            case 'smallPaddle': {
                const target: 'joueur' | 'ia' = this.lastPaddleHit === 'joueur' ? 'ia' : 'joueur';
                const paddle = target === 'joueur' ? this.joueurPaddle : this.iaPaddle;
                paddle.height = this.defaultPaddleHeight * 0.5;
                this.activePowerUps.push({ type, expiresAt: now + 8000, target });
                break;
            }
            case 'multiBall': {
                const angle = (Math.random() - 0.5) * Math.PI;
                this.extraBalls.push({
                    x: this.ball.x, y: this.ball.y,
                    vx: Math.cos(angle) * this.ballSpeed,
                    vy: Math.sin(angle) * this.ballSpeed,
                    radius: this.ballRadius,
                });
                this.activePowerUps.push({ type, expiresAt: now + 5000 });
                break;
            }
        }

        EventBus.emit('powerup-activated', { type, duration: type === 'bigPaddle' || type === 'smallPaddle' ? 8000 : 5000 });

        // Floating label
        const label = this.add.text(this.gameWidth / 2, 70, labels[type], {
            fontFamily: 'Arial', fontSize: '18', color: '#ffffff', align: 'center',
        }).setOrigin(0.5).setAlpha(1);
        this.powerUpLabelGraphics.push(label);
        this.tweens.add({
            targets: label, alpha: 0, y: 55, duration: 1500,
            onComplete: () => {
                label.destroy();
                const idx = this.powerUpLabelGraphics.indexOf(label);
                if (idx !== -1) this.powerUpLabelGraphics.splice(idx, 1);
            },
        });
    }

    private checkExpiredPowerUps(time: number) {
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const pu = this.activePowerUps[i];
            if (time < pu.expiresAt) continue;

            switch (pu.type) {
                case 'speed':
                case 'slow': {
                    const currentSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
                    if (currentSpeed > 0) {
                        const scale = this.defaultBallSpeed / currentSpeed;
                        this.ball.vx *= scale;
                        this.ball.vy *= scale;
                    }
                    break;
                }
                case 'bigPaddle':
                case 'smallPaddle': {
                    if (pu.target) {
                        const paddle = pu.target === 'joueur' ? this.joueurPaddle : this.iaPaddle;
                        paddle.height = this.defaultPaddleHeight;
                    }
                    break;
                }
                case 'multiBall': {
                    this.extraBalls = [];
                    break;
                }
            }
            this.activePowerUps.splice(i, 1);
        }
    }

    private updateExtraBalls(deltaSeconds: number) {
        for (let i = this.extraBalls.length - 1; i >= 0; i--) {
            const eb = this.extraBalls[i];
            eb.x += eb.vx * deltaSeconds;
            eb.y += eb.vy * deltaSeconds;

            if (eb.y - eb.radius < 10) { eb.y = 10 + eb.radius; eb.vy = -eb.vy; }
            if (eb.y + eb.radius > this.gameHeight - 10) { eb.y = this.gameHeight - 10 - eb.radius; eb.vy = -eb.vy; }

            if (eb.x - eb.radius < 0 || eb.x + eb.radius > this.gameWidth) {
                this.extraBalls.splice(i, 1);
                continue;
            }

            this.checkExtraBallPaddleCollision(eb, this.joueurPaddle);
            this.checkExtraBallPaddleCollision(eb, this.iaPaddle);
        }
    }

    private checkExtraBallPaddleCollision(
        eb: { x: number; y: number; vx: number; vy: number; radius: number },
        paddle: { x: number; y: number; width: number; height: number }
    ) {
        if (
            eb.x + eb.radius > paddle.x &&
            eb.x - eb.radius < paddle.x + paddle.width &&
            eb.y + eb.radius > paddle.y &&
            eb.y - eb.radius < paddle.y + paddle.height
        ) {
            if (eb.vx > 0 && paddle === this.iaPaddle) {
                eb.vx = -eb.vx;
                eb.x = paddle.x - eb.radius;
            } else if (eb.vx < 0 && paddle === this.joueurPaddle) {
                eb.vx = -eb.vx;
                eb.x = paddle.x + paddle.width + eb.radius;
            }
        }
    }

    private drawPowerUps(time: number) {
        this.powerUpGraphics.clear();
        const pulse = 0.8 + Math.sin(time * 0.005) * 0.2;

        for (const pu of this.powerUps) {
            if (!pu.active) continue;
            const r = pu.radius * pulse;

            // Outer glow
            this.powerUpGraphics.fillStyle(pu.color, 0.25);
            this.powerUpGraphics.fillCircle(pu.x, pu.y, r + 4);
            // Main circle
            this.powerUpGraphics.fillStyle(pu.color, 0.9);
            this.powerUpGraphics.fillCircle(pu.x, pu.y, r);
            // Inner bright core
            this.powerUpGraphics.fillStyle(0xffffff, 0.5);
            this.powerUpGraphics.fillCircle(pu.x, pu.y, r * 0.4);
            // Border ring
            this.powerUpGraphics.lineStyle(1.5, 0xffffff, 0.8);
            this.powerUpGraphics.strokeCircle(pu.x, pu.y, r);
        }
    }

    private drawExtraBalls() {
        this.extraBallGraphics.clear();
        this.extraBallGraphics.fillStyle(0xff00ff, 0.9);
        for (const eb of this.extraBalls) {
            this.extraBallGraphics.fillCircle(eb.x, eb.y, eb.radius);
        }
    }

    private clearPowerUpLabels() {
        for (const label of this.powerUpLabelGraphics) {
            label.destroy();
        }
        this.powerUpLabelGraphics = [];
    }

    public getJoueurPaddle() {
        return this.joueurPaddle;
    }

    public getIAPaddle() {
        return this.iaPaddle;
    }

    public getBall() {
        return this.ball;
    }

    public getScores() {
        return {
            joueur: this.joueurScore,
            ia: this.iaScore,
        };
    }

    public getIsMultiplayer() {
        return this.isMultiplayer;
    }
}
