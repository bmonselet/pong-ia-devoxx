import { useRef, useState, useEffect } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { EventBus } from './game/EventBus';

type Difficulty = 'easy' | 'medium' | 'hard';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [currentScene, setCurrentScene] = useState<Phaser.Scene | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [scores, setScores] = useState({ joueur: 0, ia: 0 });
    const [isMultiplayer, setIsMultiplayer] = useState<boolean>(false);

    const handleCurrentScene = (scene: Phaser.Scene) => {
        setCurrentScene(scene);
    };

    useEffect(() => {
        const onScoreUpdate = (data: { joueur: number; ia: number }) => {
            setScores(data);
        };

        EventBus.on('score-update', onScoreUpdate);

        // Emit initial difficulty when component mounts
        if (currentScene) {
            EventBus.emit('difficulty-changed', difficulty);
        }

        return () => {
            EventBus.removeListener('score-update', onScoreUpdate);
        };
    }, [difficulty, currentScene]);

    const handleDifficultyChange = (newDifficulty: Difficulty) => {
        setDifficulty(newDifficulty);
        EventBus.emit('difficulty-changed', newDifficulty);
        handleNewGame();
    };

    const handleNewGame = () => {
        if (currentScene && typeof currentScene.events.emit === 'function') {
            currentScene.events.emit('reset-game');
            setScores({ joueur: 0, ia: 0 });
        }
    };

    const handleToggleMultiplayer = () => {
        setIsMultiplayer(!isMultiplayer);
        EventBus.emit('toggle-multiplayer', !isMultiplayer);
        handleNewGame();
    };

    return (
        <div className="app-container">
            <div className="game-container">
                <PhaserGame ref={phaserRef} currentActiveScene={handleCurrentScene} />
            </div>
            <div className="ui-container">
                <h1>Pong IA</h1>
                
                <div className="score-display">
                    <div className="score-item player">
                        <span className="score-label">{isMultiplayer ? 'P1' : 'You'}:</span>
                        <span className="score-value">{scores.joueur}</span>
                    </div>
                    <div className="score-separator">|</div>
                    <div className="score-item ai">
                        <span className="score-label">{isMultiplayer ? 'P2' : 'IA'}:</span>
                        <span className="score-value">{scores.ia}</span>
                    </div>
                </div>

                <div className="mode-selector">
                    <label className="checkbox-container">
                        <input
                            type="checkbox"
                            checked={isMultiplayer}
                            onChange={handleToggleMultiplayer}
                        />
                        <span className="checkbox-label">Multiplayer Mode</span>
                    </label>
                </div>

                {!isMultiplayer && (
                    <div className="difficulty-selector">
                        <p className="selector-label">Difficulty</p>
                        <div className="button-group">
                            <button
                                className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
                                onClick={() => handleDifficultyChange('easy')}
                            >
                                Easy
                            </button>
                            <button
                                className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
                                onClick={() => handleDifficultyChange('medium')}
                            >
                                Medium
                            </button>
                            <button
                                className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
                                onClick={() => handleDifficultyChange('hard')}
                            >
                                Hard
                            </button>
                        </div>
                    </div>
                )}

                <div className="game-controls">
                    <button className="button reset-btn" onClick={handleNewGame}>
                        New Game
                    </button>
                </div>

                <div className="instructions">
                    <h3>How to Play</h3>
                    <ul>
                        {isMultiplayer ? (
                            <>
                                <li><strong>Player 1 (Left):</strong> Arrow Up / Down keys</li>
                                <li><strong>Player 2 (Right):</strong> Z (up) / S (down) keys</li>
                                <li><strong>Objective:</strong> Reach 11 points to win</li>
                                <li><strong>Rules:</strong> Bounce the ball back and forth</li>
                            </>
                        ) : (
                            <>
                                <li><strong>Controls:</strong> Arrow Up / Down keys</li>
                                <li><strong>Objective:</strong> Reach 11 points to win</li>
                                <li><strong>Opponent:</strong> AI with adaptive difficulty</li>
                                <li><strong>Rules:</strong> Bounce the ball back and forth</li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default App;
