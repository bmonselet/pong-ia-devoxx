export class Paddle {
  private x: number;
  private y: number;
  private readonly width: number = 10;
  private readonly height: number = 100;
  private readonly maxY: number;
  private readonly minY: number = 0;
  private velocity: number = 0;
  private readonly maxVelocity: number = 300; // px/s

  constructor(x: number, initialY: number, gameHeight: number) {
    this.x = x;
    this.y = Math.max(0, Math.min(initialY, gameHeight - this.height));
    this.maxY = gameHeight - this.height;
  }

  // Getters
  getX(): number {
    return this.x;
  }

  getY(): number {
    return this.y;
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }

  getCenterY(): number {
    return this.y + this.height / 2;
  }

  // Movement methods
  moveUp(): void {
    this.velocity = -this.maxVelocity;
  }

  moveDown(): void {
    this.velocity = this.maxVelocity;
  }

  stop(): void {
    this.velocity = 0;
  }

  // Update position based on velocity
  update(delta: number): void {
    const deltaSeconds = delta / 1000;
    this.y += this.velocity * deltaSeconds;

    // Apply boundary constraints
    if (this.y < this.minY) {
      this.y = this.minY;
    }
    if (this.y > this.maxY) {
      this.y = this.maxY;
    }
  }

  // Set Y position directly with constraints
  setY(y: number): void {
    this.y = Math.max(this.minY, Math.min(y, this.maxY));
  }

  // Collision detection with ball using AABB
  checkCollisionWithBall(ballX: number, ballY: number, ballRadius: number): boolean {
    const paddleLeft = this.x - 5;
    const paddleRight = this.x + this.width + 5;
    const paddleTop = this.y - 5;
    const paddleBottom = this.y + this.height + 5;

    const closestX = Math.max(paddleLeft, Math.min(ballX, paddleRight));
    const closestY = Math.max(paddleTop, Math.min(ballY, paddleBottom));

    const distanceX = ballX - closestX;
    const distanceY = ballY - closestY;

    return distanceX * distanceX + distanceY * distanceY < ballRadius * ballRadius;
  }

  // Check if paddle is in top third (for bounce angle calculation)
  isTopThird(): boolean {
    return this.y < this.height / 3;
  }

  // Check if paddle is in bottom third (for bounce angle calculation)
  isBottomThird(): boolean {
    return this.y > (2 * this.height) / 3;
  }

  // Check if paddle is at top boundary
  isAtTop(): boolean {
    return this.y < 10;
  }

  // Check if paddle is at bottom boundary
  isAtBottom(): boolean {
    return this.y > this.maxY - 10;
  }

  // Get current velocity
  getVelocity(): number {
    return this.velocity;
  }
}
