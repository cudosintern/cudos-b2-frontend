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
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Register plugins
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

// Custom plugin to draw border box around the chart area
const chartAreaBorder = {
    id: 'chartAreaBorder',
    beforeDraw(chart: any) {
        const { ctx, chartArea: { left, top, width, height } } = chart;
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(left, top, width, height);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(left, top, width, height);
        ctx.restore();
    }
};

// Custom plugin to draw a drop shadow on the bars matching the screenshot style
const barShadowPlugin = {
    id: 'barShadowPlugin',
    beforeDatasetDraw(chart: any) {
        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    },
    afterDatasetDraw(chart: any) {
        const { ctx } = chart;
        ctx.restore();
    }
};

interface ChartSeriesItem {
    name: string;
    data: number[];
    color: string;
}

interface CceAttainmentChartProps {
    id?: string;
    labels: string[];
    series: ChartSeriesItem[];
    coStatements?: { [code: string]: string };
}

const CceAttainmentChart: React.FC<CceAttainmentChartProps> = ({ id, labels, series, coStatements = {} }) => {
    // Pad to align bars to the left like the reference image
    const minColumns = 10;
    const paddedLabels = [...labels];
    while (paddedLabels.length < minColumns) {
        paddedLabels.push("");
    }

    const paddedSeries = series.map((s) => {
        const paddedData = [...s.data];
        while (paddedData.length < minColumns) {
            paddedData.push(null as any);
        }
        return {
            ...s,
            data: paddedData,
        };
    });

    const chartData = {
        labels: paddedLabels,
        datasets: paddedSeries.map((s) => ({
            label: s.name,
            data: s.data,
            backgroundColor: s.color || '#5FA9B2',
            borderColor: s.color || '#5FA9B2',
            borderWidth: 1,
            borderRadius: 0,
            maxBarThickness: 18,
            categoryPercentage: 0.7,
            barPercentage: 0.8,
            datalabels: {
                display: 'auto' as const,
                anchor: 'end' as const,
                align: 'top' as const,
                offset: 4,
                color: '#333',
                font: { weight: 'bold' as const, size: 10 },
                formatter: (value: any) => (value !== null && value !== undefined && !isNaN(value)) ? value.toFixed(2) : "",
            },
        })),
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        if (value === null || value === undefined) return '';
                        return ` ${context.dataset.label}: ${value.toFixed(2)}%`;
                    },
                    afterBody: (tooltipItems: any[]) => {
                        const label = tooltipItems[0].label;
                        if (!label) return [];
                        const statement = coStatements[label];
                        if (statement) {
                            const wrapText = (text: string, maxLen: number = 40): string[] => {
                                const words = text.split(' ');
                                const lines: string[] = [];
                                let currentLine = '';
                                words.forEach(word => {
                                    if ((currentLine + word).length > maxLen) {
                                        lines.push(currentLine.trim());
                                        currentLine = word + ' ';
                                    } else {
                                        currentLine += word + ' ';
                                    }
                                });
                                if (currentLine) lines.push(currentLine.trim());
                                return lines;
                            };
                            return ['', 'Statement:', ...wrapText(statement, 45)];
                        }
                        return [];
                    }
                },
            },
            legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                    usePointStyle: false,
                    boxWidth: 15,
                    boxHeight: 12,
                    font: { size: 11, weight: 'bold' as const },
                    color: '#374151',
                    padding: 20
                }
            },
            datalabels: { /* configured inside datasets */ },
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25,
                    callback: (value: any) => `${Number(value).toFixed(2)}%`,
                    color: '#666666',
                    font: { size: 11 },
                },
                title: { display: false },
                grid: { color: '#e5e7eb' },
                border: { display: false },
            },
            x: {
                ticks: {
                    color: '#666666',
                    font: { size: 11 },
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 0,
                },
                title: { display: false },
                grid: {
                    color: '#e5e7eb',
                    offset: true,
                },
                border: { display: false },
            },
        },
        layout: { padding: { top: 20, bottom: 5, left: 10, right: 10 } },
    };

    const minChartWidth = Math.max(600, (labels.length || 0) * 75);

    return (
        <div className="w-full bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="w-full overflow-x-auto">
                <div style={{ height: '320px', minWidth: `${minChartWidth}px`, width: '100%', margin: '0' }}>
                    <Bar id={id || "cce-attainment-chart-canvas"} data={chartData} options={options} plugins={[chartAreaBorder, barShadowPlugin, ChartDataLabels]} />
                </div>
            </div>
        </div>
    );
};

export default CceAttainmentChart;