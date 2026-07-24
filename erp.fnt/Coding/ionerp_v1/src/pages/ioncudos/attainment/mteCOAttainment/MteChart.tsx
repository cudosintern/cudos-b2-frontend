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
import annotationPlugin from 'chartjs-plugin-annotation';

// Register plugins
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels,
    annotationPlugin
);

// Custom plugin to draw border box around the chart area
const chartAreaBorder = {
    id: 'chartAreaBorder',
    beforeDraw(chart: any) {
        const { ctx, chartArea: { left, top, width, height } } = chart;
        ctx.save();
        // Draw white background for chart area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(left, top, width, height);
        // Draw border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(left, top, width, height);
        ctx.restore();
    }
};

// Custom plugin to draw a drop shadow on the bars
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

interface Props {
    xAxis: string[];
    yAxis: number[];
    tooltips: string[];
    courseId?: number | null;
    // Optional: custom thresholds
    thresholds?: { label: string; value: number; color?: string }[];
}

const MteChart: React.FC<Props> = ({ xAxis, yAxis, tooltips, courseId, thresholds }) => {
    // List of premium, harmonious color palettes (each has 4 colors for Zero, Low, Medium, High)
    const palettes = [
        ['#800020', '#D97706', '#059669', '#1D4ED8'], // Palette 0: Burgundy, Amber, Emerald, Royal Blue
        ['#115E59', '#0EA5E9', '#6366F1', '#D946EF'], // Palette 1: Teal, Light Blue, Indigo, Fuchsia
        ['#064E3B', '#84CC16', '#F59E0B', '#EC4899'], // Palette 2: Forest Green, Lime, Amber, Pink
        ['#4C1D95', '#F43F5E', '#EAB308', '#10B981'], // Palette 3: Deep Purple, Rose, Yellow, Green
        ['#1E293B', '#3B82F6', '#10B981', '#8B5CF6'], // Palette 4: Slate, Blue, Green, Purple
        ['#831843', '#EC4899', '#F97316', '#14B8A6'], // Palette 5: Deep Pink, Pink, Orange, Teal
        ['#3B0764', '#C084FC', '#06B6D4', '#F43F5E'], // Palette 6: Purple, Light Purple, Cyan, Rose
        ['#7F1D1D', '#F97316', '#10B981', '#2563EB'], // Palette 7: Red, Orange, Green, Blue
    ];

    // Select color palette based on courseId
    const paletteIndex = courseId ? Math.abs(courseId) % palettes.length : null;
    const colors = paletteIndex !== null ? palettes[paletteIndex] : ['#806000', '#e8d502', '#8ae802', '#663399'];

    // Default thresholds
    const defaultThresholds = [
        { label: 'Zero (0.00%)', value: 0, color: colors[0] },
        { label: 'Low (50.00%)', value: 50, color: colors[1] },
        { label: 'Medium (60.00%)', value: 60, color: colors[2] },
        { label: 'High (70.00%)', value: 70, color: colors[3] },
    ];
    const usedThresholds = thresholds || defaultThresholds;

    // Build solid annotation lines
    const annotations = usedThresholds.reduce((acc, th, index) => {
        acc[`line${index}`] = {
            type: 'line',
            yMin: th.value,
            yMax: th.value,
            borderColor: th.color,
            borderWidth: 1.5,
            label: {
                enabled: false,
            },
        };
        return acc;
    }, {} as any);

    // Pad to align bars to the left like the reference image
    const minColumns = 10;
    const paddedLabels = [...xAxis];
    const paddedYAxis = [...yAxis];
    const paddedTooltips = [...tooltips];

    while (paddedLabels.length < minColumns) {
        paddedLabels.push("");
        paddedYAxis.push(null as any);
        paddedTooltips.push("");
    }

    const data = {
        labels: paddedLabels,
        datasets: [
            {
                label: 'Threshold Direct Attainment %',
                data: paddedYAxis,
                backgroundColor: '#4BB2C5',
                borderColor: '#3a9aaa',
                borderWidth: 1,
                borderRadius: 0,
                maxBarThickness: 20,
                clip: false as const,
                datalabels: {
                    display: 'auto' as const,
                    anchor: 'end' as const,
                    align: 'top' as const,
                    offset: 4,
                    color: '#333',
                    font: { weight: 'bold' as const, size: 11 },
                    formatter: (value: any) => (value !== null && value !== undefined && !isNaN(value)) ? value.toFixed(2) : "",
                },
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        const index = context.dataIndex;
                        const tooltipText = paddedTooltips[index] || '';
                        if (value === null || value === undefined) return '';
                        return [`Threshold: ${value}%`, tooltipText];
                    },
                },
            },
            legend: { display: false },
            annotation: { annotations },
            datalabels: { /* configured in dataset */ },
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 10,
                    callback: (value: any) => `${value}%`,
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
                    offset: false,
                },
                border: { display: false },
            },
        },
        layout: { padding: { top: 25, bottom: 5, left: 10, right: 10 } },
    };

    const minChartWidth = Math.max(600, (xAxis.length || 0) * 60);

    return (
        <div className="w-full bg-[#f8f8f6] p-6 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
            {/* Chart Area wrapper with aspect ratio and sizing */}
            <div className="w-full overflow-x-auto">
                <div style={{ height: '320px', minWidth: `${minChartWidth}px`, width: '100%', margin: '0' }}>
                    <Bar data={data} options={options} plugins={[chartAreaBorder, barShadowPlugin, ChartDataLabels]} />
                </div>
            </div>

            {/* Custom Legend Box (Threshold Direct Attainment %) */}
            <div className="flex justify-center mt-6 w-full">
                <div className="inline-flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 shadow-sm text-xs font-medium text-gray-700">
                    <span className="inline-block w-4 h-3 bg-[#4BB2C5] border border-[#3a9aaa]" />
                    <span>Threshold Direct Attainment %</span>
                </div>
            </div>

            {/* Custom Legend for Thresholds */}
            <div className="mt-8 flex flex-wrap justify-center gap-8 text-sm w-full">
                {usedThresholds.map((th, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <span
                            className="inline-block w-5 h-5"
                            style={{ backgroundColor: th.color }}
                        />
                        <span className="font-semibold text-gray-700">{th.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MteChart;
