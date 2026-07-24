import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { GraphData } from '../types/mteAttainment.types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface AttainmentGraphProps {
    graphData: GraphData;
}

const AttainmentGraph: React.FC<AttainmentGraphProps> = ({ graphData }) => {
    const data = {
        labels: graphData.x,
        datasets: [
            {
                label: graphData.series_label,
                data: graphData.y,
                backgroundColor: '#4BB2C5',
                borderColor: '#4BB2C5',
                borderWidth: 1,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: graphData.y_min,
                max: graphData.y_max,
                ticks: {
                    stepSize: graphData.y_tick_interval,
                    callback: (value: string | number) => `${value}%`,
                },
                title: {
                    display: true,
                    text: 'Threshold Direct Attainment %',
                },
            },
            x: {
                title: {
                    display: true,
                    text: 'Course Outcomes (COs)',
                },
            },
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        const coIndex = context.dataIndex;
                        const coStatement = graphData.tooltips[coIndex] || '';
                        return [`${value}%`, coStatement];
                    },
                },
            },
            legend: {
                position: 'top' as const,
            },
        },
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="rounded-t-2xl bg-slate-800 px-5 py-3">
                <h3 className="text-lg font-semibold text-white">Course Outcome (COs) Attainment</h3>
            </div>
            <div className="px-5 py-5">
                <div className="h-80 w-full">
                    <Bar data={data} options={options} />
                </div>
            </div>
        </div>
    );
};

export default AttainmentGraph;
