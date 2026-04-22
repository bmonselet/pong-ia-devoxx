import React, { useState } from 'react';
import { EventBus } from './game/EventBus';

interface BallParams {
    minSpeed: number;
    maxSpeed: number;
    accelerationFactor: number;
    maxSpeedMultiplier: number;
    angleRangeMin: number;
    angleRangeMax: number;
    spinInfluence: number;
    spinDecay: number;
}

export const DebugPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [params, setParams] = useState<BallParams>({
        minSpeed: 450,
        maxSpeed: 700,
        accelerationFactor: 1.05,
        maxSpeedMultiplier: 2.0,
        angleRangeMin: -30,
        angleRangeMax: 30,
        spinInfluence: 0.3,
        spinDecay: 0.98
    });

    const handleSliderChange = (key: keyof BallParams, value: number) => {
        const newParams = { ...params, [key]: value };
        setParams(newParams);
        EventBus.emit('update-ball-params', newParams);
    };

    const handleReset = () => {
        const defaultParams: BallParams = {
            minSpeed: 450,
            maxSpeed: 700,
            accelerationFactor: 1.05,
            maxSpeedMultiplier: 2.0,
            angleRangeMin: -30,
            angleRangeMax: 30,
            spinInfluence: 0.3,
            spinDecay: 0.98
        };
        setParams(defaultParams);
        EventBus.emit('update-ball-params', defaultParams);
    };

    return (
        <div className="debug-panel">
            <button 
                className="debug-toggle"
                onClick={() => setIsOpen(!isOpen)}
            >
                🔧 Debug
            </button>

            {isOpen && (
                <div className="debug-content">
                    <h3>⚙️ Paramètres Balle</h3>
                    
                    <div className="slider-group">
                        <label>Vitesse Min: {params.minSpeed.toFixed(0)} px/s</label>
                        <input 
                            type="range" 
                            min="100" 
                            max="500" 
                            value={params.minSpeed}
                            onChange={(e) => handleSliderChange('minSpeed', Number(e.target.value))}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Vitesse Max: {params.maxSpeed.toFixed(0)} px/s</label>
                        <input 
                            type="range" 
                            min="300" 
                            max="1000" 
                            value={params.maxSpeed}
                            onChange={(e) => handleSliderChange('maxSpeed', Number(e.target.value))}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Facteur Accélération: {params.accelerationFactor.toFixed(3)}</label>
                        <input 
                            type="range" 
                            min="1.00" 
                            max="1.20" 
                            step="0.01"
                            value={params.accelerationFactor}
                            onChange={(e) => handleSliderChange('accelerationFactor', Number(e.target.value))}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Multiplicateur Max Vitesse: {params.maxSpeedMultiplier.toFixed(1)}x</label>
                        <input 
                            type="range" 
                            min="1.0" 
                            max="5.0" 
                            step="0.1"
                            value={params.maxSpeedMultiplier}
                            onChange={(e) => handleSliderChange('maxSpeedMultiplier', Number(e.target.value))}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Angle Min: {params.angleRangeMin.toFixed(0)}°</label>
                        <input 
                            type="range" 
                            min="-90" 
                            max="0" 
                            value={params.angleRangeMin}
                            onChange={(e) => handleSliderChange('angleRangeMin', Number(e.target.value))}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Angle Max: {params.angleRangeMax.toFixed(0)}°</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="90" 
                            value={params.angleRangeMax}
                            onChange={(e) => handleSliderChange('angleRangeMax', Number(e.target.value))}
                        />
                    </div>

                    <h3>🌀 Paramètres Spin</h3>

                    <div className="slider-group">
                        <label>Spin Influence: {params.spinInfluence.toFixed(2)}</label>
                        <input 
                            type="range" 
                            min="0" 
                            max="1.0" 
                            step="0.05"
                            value={params.spinInfluence}
                            onChange={(e) => handleSliderChange('spinInfluence', Number(e.target.value))}
                        />
                    </div>

                    <div className="slider-group">
                        <label>Spin Decay: {params.spinDecay.toFixed(2)}</label>
                        <input 
                            type="range" 
                            min="0.90" 
                            max="1.00" 
                            step="0.01"
                            value={params.spinDecay}
                            onChange={(e) => handleSliderChange('spinDecay', Number(e.target.value))}
                        />
                    </div>

                    <button className="reset-btn-debug" onClick={handleReset}>
                        🔄 Reset Défaut
                    </button>
                </div>
            )}
        </div>
    );
};
