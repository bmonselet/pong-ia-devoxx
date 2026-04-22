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

        // Bounce off top and bottom walls
        if (this.ball.y - this.ball.radius < 10) {
            this.ball.y = 10 + this.ball.radius;
            this.ball.vy = -this.ball.vy;
        }
        if (this.ball.y + this.ball.radius > this.gameHeight - 10) {
            this.ball.y = this.gameHeight - 10 - this.ball.radius;
            this.ball.vy = -this.ball.vy;
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

        // Redraw game elements
        this.drawPaddles();
        this.drawBall();
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
            } else if (this.ball.vx < 0 && paddle === this.joueurPaddle) {
                // Ball coming from right, hitting left paddle
                this.ball.vx = -this.ball.vx;
                this.ball.x = paddleRight + this.ball.radius;
            }

            // Add some vertical spin based on where ball hit paddle
            const paddleCenterY = paddle.y + paddle.height / 2;
            const relativeIntersectY = paddleCenterY - this.ball.y;
            const bounceAngle = (relativeIntersectY / (paddle.height / 2)) * 0.3; // Max 30 degrees
            this.ball.vy += bounceAngle * Math.abs(this.ball.vx) * 0.5;
        }
    }

    private resetBall() {
        // Reset ball to center with random direction
        this.ball.x = this.gameWidth / 2;
        this.ball.y = this.gameHeight / 2;

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
        this.ballGraphics.fillStyle(0xffffff, 1);
        this.ballGraphics.fillCircle(this.ball.x, this.ball.y, this.ball.radius);
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
