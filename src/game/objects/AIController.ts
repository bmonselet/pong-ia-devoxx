import { Paddle } from './Paddle';
import { Ball } from './Ball';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface BallState {
  y: number;
  timestamp: number;
}

export class AIController {
  private difficulty: DifficultyLevel;
  private paddle: Paddle;
  private ball: Ball;
  private gameHeight: number;
  private reactionTime: number = 0;
  private randomFactor: number = 0;
  private ballHistory: BallState[] = [];
  private missRNG: number = 0;

  // Configuration par niveau de difficulté
  private readonly REACTION_DELAYS = {
    easy: 400, // ms
    medium: 150, // ms
    hard: 25, // ms
  };

  private readonly ERROR_MARGINS = {
    easy: 80, // px
    medium: 40, // px
    hard: 10, // px
  };

  private readonly MISS_RATES = {
    easy: 0.30, // 30%
    medium: 0.10, // 10%
    hard: 0.05, // 5%
  };

  private readonly MOVEMENT_THRESHOLD = 10; // px, seuil avant de bouger

  constructor(
    difficulty: DifficultyLevel,
    paddle: Paddle,
    ball: Ball,
    gameHeight: number
  ) {
    this.difficulty = difficulty;
    this.paddle = paddle;
    this.ball = ball;
    this.gameHeight = gameHeight;
    this.reset();
  }

  /**
   * Mettre à jour la position de la raquette IA à chaque frame
   */
  update(delta: number): void {
    // Enregistrer la position actuelle de la balle
    this.recordBallState(this.ball.getY());

    // Récupérer la position historique de la balle selon le délai de réaction
    const historicalBallY = this.getHistoricalBallY();

    // Calculer la position cible avec marge d'erreur
    let targetY = this.calculateTargetY(historicalBallY);

    // Appliquer le facteur aléatoire selon la difficulté
    targetY = this.applyRandomFactor(targetY);

    // Vérifier le taux de raté
    if (this.shouldMiss()) {
      // Ignorer la balle intentionnellement
      this.paddle.stop();
      return;
    }

    // Commander le mouvement de la raquette
    const paddleCenter = this.paddle.getCenterY();
    const threshold = this.MOVEMENT_THRESHOLD;

    if (paddleCenter < targetY - threshold) {
      this.paddle.moveDown();
    } else if (paddleCenter > targetY + threshold) {
      this.paddle.moveUp();
    } else {
      this.paddle.stop();
    }
  }

  /**
   * Enregistrer la position Y de la balle avec timestamp
   */
  private recordBallState(ballY: number): void {
    const currentTime = Date.now();
    this.ballHistory.push({ y: ballY, timestamp: currentTime });

    // Garder seulement les 30 derniers états (pour une latence max d'environ 500ms)
    if (this.ballHistory.length > 30) {
      this.ballHistory.shift();
    }
  }

  /**
   * Récupérer la position de la balle avec délai de réaction
   */
  private getHistoricalBallY(): number {
    const reactionDelay = this.REACTION_DELAYS[this.difficulty];
    const currentTime = Date.now();
    const targetTime = currentTime - reactionDelay;

    // Trouver l'état de la balle le plus proche du temps cible
    let closestState = this.ballHistory[0] || { y: this.ball.getY() };

    for (const state of this.ballHistory) {
      if (state.timestamp <= targetTime) {
        closestState = state;
      } else {
        break;
      }
    }

    return closestState.y;
  }

  /**
   * Calculer la position cible Y pour la raquette
   */
  private calculateTargetY(ballY: number): number {
    const paddleHeight = this.paddle.getHeight();
    const paddleMinY = 0;
    const paddleMaxY = this.gameHeight - paddleHeight;

    // Position cible: centre de la raquette au niveau de la balle
    let targetY = ballY - paddleHeight / 2;

    // Limiter aux limites du terrain
    targetY = Math.max(paddleMinY, Math.min(targetY, paddleMaxY));

    return targetY;
  }

  /**
   * Appliquer le facteur aléatoire selon la difficulté
   */
  private applyRandomFactor(targetY: number): number {
    const errorMargin = this.ERROR_MARGINS[this.difficulty];

    // Générer un facteur aléatoire entre -errorMargin et +errorMargin
    const randomError = (Math.random() - 0.5) * 2 * errorMargin;

    return targetY + randomError;
  }

  /**
   * Déterminer si l'IA doit rater intentionnellement
   */
  private shouldMiss(): boolean {
    const missRate = this.MISS_RATES[this.difficulty];

    // Générer un nouveau RNG toutes les 60 frames (1 second à 60 FPS)
    this.missRNG = Math.random();

    return this.missRNG < missRate;
  }

  /**
   * Changer le niveau de difficulté
   */
  setDifficulty(difficulty: DifficultyLevel): void {
    this.difficulty = difficulty;
    this.reset();
  }

  /**
   * Retourner le niveau de difficulté actuel
   */
  getDifficulty(): DifficultyLevel {
    return this.difficulty;
  }

  /**
   * Réinitialiser l'état de l'IA
   */
  reset(): void {
    this.reactionTime = 0;
    this.randomFactor = 0;
    this.ballHistory = [];
    this.missRNG = 0;
    this.paddle.stop();
  }
}
