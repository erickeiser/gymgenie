
import React, { useMemo } from 'react';
import type { Workout } from '../types';
import { ChartLineIcon } from './icons';

interface ExerciseProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  plan: Workout[];
}

interface ProgressionData {
  week: number;
  repVolume: number;
}

const ProgressionChart: React.FC<{ data: ProgressionData[] }> = ({ data }) => {
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxVolume = Math.max(...data.map(d => d.repVolume), 0);
    const yMax = Math.ceil((maxVolume + 1) / 10) * 10; // Round up to nearest 10

    const xScale = (week: number) => margin.left + ((week - 1) / 11) * innerWidth;
    const yScale = (volume: number) => margin.top + innerHeight - (volume / yMax) * innerHeight;

    const linePath = data
        .map(d => `${xScale(d.week)},${yScale(d.repVolume)}`)
        .join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            {/* Y-Axis */}
            <g className="text-xs text-gray-500">
                {[...Array(6)].map((_, i) => {
                    const y = margin.top + (i * innerHeight / 5);
                    const value = yMax - (i * yMax / 5);
                    return (
                        <g key={i}>
                            <line x1={margin.left} y1={y} x2={width - margin.right} y2={y} className="stroke-current opacity-20" />
                            <text x={margin.left - 8} y={y + 4} textAnchor="end">{value}</text>
                        </g>
                    );
                })}
                <text transform={`translate(15, ${height / 2}) rotate(-90)`} textAnchor="middle" className="fill-current text-gray-400">Rep Volume</text>
            </g>

            {/* X-Axis */}
            <g className="text-xs text-gray-500">
                {data.map(d => (
                    <g key={d.week}>
                       <text x={xScale(d.week)} y={height - margin.bottom + 16} textAnchor="middle">{d.week}</text>
                    </g>
                ))}
                <line x1={margin.left} y1={height - margin.bottom} x2={width - margin.right} y2={height - margin.bottom} className="stroke-current opacity-50" />
                 <text x={width/2} y={height - 5} textAnchor="middle" className="fill-current text-gray-400">Week</text>
            </g>
            
            {/* Data Line */}
            <polyline points={linePath} fill="none" stroke="#00BFFF" strokeWidth="2" />
            
            {/* Data Points */}
            {data.map(d => (
                <g key={d.week}>
                    <circle cx={xScale(d.week)} cy={yScale(d.repVolume)} r="4" fill="#00BFFF" className="stroke-brand-dark" strokeWidth="2">
                      <title>Week {d.week}: {d.repVolume} Rep Volume</title>
                    </circle>
                </g>
            ))}
        </svg>
    );
};


const ExerciseProgressionModal: React.FC<ExerciseProgressionModalProps> = ({ isOpen, onClose, exerciseName, plan }) => {
    
    const progressionData = useMemo<ProgressionData[]>(() => {
        if (!plan) return [];
        
        const parseRep = (reps: string): number => {
            if (typeof reps !== 'string') return 0;
            const parts = reps.split('-').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
            return Math.max(...parts, 0);
        };

        return plan
            .map(workout => ({
                week: workout.week,
                exercise: workout.weightExercises.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase()),
            }))
            .filter(item => item.exercise)
            .map(item => ({
                week: item.week,
                repVolume: item.exercise!.sets * parseRep(item.exercise!.reps),
            }))
            .filter(item => item.repVolume > 0);
    }, [plan, exerciseName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-light-dark rounded-lg shadow-xl p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <ChartLineIcon className="w-6 h-6 text-brand-blue" />
                        <div>
                           <h2 className="text-xl font-bold text-white">{exerciseName}</h2>
                           <p className="text-sm text-gray-400">12-Week Progression</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
                
                {progressionData.length > 1 ? (
                    <div className="bg-brand-dark p-4 rounded-md">
                        <ProgressionChart data={progressionData} />
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-10">
                        <p>Not enough data to show progression for this exercise.</p>
                        <p className="text-sm">This exercise might not be part of a recurring progression in your plan.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExerciseProgressionModal;
