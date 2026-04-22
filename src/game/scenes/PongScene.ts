import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class PongScene extends Scene {
    private joueurScore: number = 0;
    private iaScore: number = 0;

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

        // Draw initial game elements
        this.drawPaddles();
        this.drawBall();

        // Emit ready event
        EventBus.emit('current-scene-ready', this);
    }

    update(time: number, delta: number) {
        const deltaSeconds = delta / 1000;

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
            // IA scores
            this.iaScore++;
            this.resetBall();
            this.updateScore();
        }
        if (this.ball.x + this.ball.radius > this.gameWidth) {
            // Joueur scores
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

        const angle = Math.random() * Math.PI * 2;
        this.ball.vx = Math.cos(angle) * this.ballSpeed;
        this.ball.vy = Math.sin(angle) * this.ballSpeed;
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
}
