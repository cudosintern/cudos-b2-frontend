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
import { CAYPOAttainmentRow } from './CAYPOApi';

// Register Chart.js components and plugins
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

// Custom plugin to draw a drop shadow on the bars matching the First Year module
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
    data: CAYPOAttainmentRow[];
}

const CAYPOChart: React.FC<Props> = ({ data }) => {
    // Extract series names
    const seriesNames = Array.from(new Set(data.map((d) => d.series_name)));
    const labels = ['PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6'];

    // Pad to align bars to the left like the reference image
    const minColumns = 10;
    const paddedLabels = [...labels];
    while (paddedLabels.length < minColumns) {
        paddedLabels.push("");
    }

    // If no data, render placeholder
    if (!data.length) {
        return <div className="text-gray-500 text-center py-6">No data available to display charts.</div>;
    }

    // Helper to filter data by method and series name
    const getSeriesData = (method: 'threshold' | 'weighted' | 'relative', seriesName: string) => {
        const seriesData = labels.map((label) => {
            const row = data.find((d) => d.po_code === label && d.series_name === seriesName);
            if (row) {
                if (method === 'threshold') return row.method1_pct;
                if (method === 'weighted') return row.method2_pct;
                return row.method3_pct;
            }
            return null;
        });

        // Pad data to match the length of paddedLabels
        while (seriesData.length < minColumns) {
            seriesData.push(null);
        }
        return seriesData;
    };

    // Shared chart options matching the First Year module
    const getOptions = (titleText: string) => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            title: {
                display: true,
                text: titleText,
                color: '#374151',
                font: {
                    size: 13,
                    weight: 'bold' as const,
                    family: "'Inter', sans-serif"
                },
                padding: { bottom: 15 }
            },
            tooltip: {
                enabled: true,
                mode: 'nearest' as const,
                intersect: true,
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: (context: any) => {
                        const poCode = context.label;
                        if (!poCode) return '';
                        const poNum = poCode.replace('PO', '');
                        return `PO Statement: ${poNum}`;
                    }
                }
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
            datalabels: {
                display: 'auto' as const,
                anchor: 'end' as const,
                align: 'top' as const,
                offset: 4,
                color: '#333',
                font: {
                    weight: 'bold' as const,
                    size: 10,
                    family: "'Inter', sans-serif"
                },
                formatter: (value: any) => {
                    if (value === 0) return '0%';
                    return value !== null && value !== undefined && !isNaN(value) ? value.toFixed(2) : '';
                }
            }
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 25,
                    callback: (value: any) => `${Number(value).toFixed(2)}%`,
                    color: '#666666',
                    font: { size: 11 }
                },
                title: { display: false },
                grid: { color: '#e5e7eb' },
                border: { display: false }
            },
            x: {
                ticks: {
                    color: '#666666',
                    font: { size: 11 },
                    autoSkip: false,
                    maxRotation: 45,
                    minRotation: 0
                },
                title: { display: false },
                grid: {
                    color: '#e5e7eb',
                    offset: true
                },
                border: { display: false }
            }
        },
        layout: {
            padding: { top: 20, bottom: 5, left: 10, right: 10 }
        }
    });

    // Helper to build datasets for a specific method
    const getChartDataForMethod = (method: 'threshold' | 'weighted' | 'relative') => {
        // Series 1: #5FA9B2, Series 2: #4F84A7
        const colors = ['#5FA9B2', '#4F84A7'];
        return {
            labels: paddedLabels,
            datasets: seriesNames.map((name, idx) => ({
                label: name,
                data: getSeriesData(method, name),
                backgroundColor: colors[idx % colors.length],
                borderColor: colors[idx % colors.length],
                borderWidth: 1,
                borderRadius: 0,
                maxBarThickness: 18,
                categoryPercentage: 0.7,
                barPercentage: 0.8
            }))
        };
    };

    // Calculate min width for scrollability matching existing charts style
    const minChartWidth = Math.max(600, (paddedLabels.length || 0) * 75);

    return (
        <div className="grid grid-cols-1 gap-8 w-full text-left">
            {/* Graph 1: Threshold Method */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                <div className="w-full bg-white p-4 flex flex-col items-center">
                    <div className="w-full overflow-x-auto">
                        <div style={{ height: '320px', minWidth: `${minChartWidth}px`, width: '100%', margin: '0' }}>
                            <Bar
                                data={getChartDataForMethod('threshold')}
                                options={getOptions('Attainment based on Threshold method')}
                                plugins={[chartAreaBorder, barShadowPlugin]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph 2: Weighted Average Method */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                <div className="w-full bg-white p-4 flex flex-col items-center">
                    <div className="w-full overflow-x-auto">
                        <div style={{ height: '320px', minWidth: `${minChartWidth}px`, width: '100%', margin: '0' }}>
                            <Bar
                                data={getChartDataForMethod('weighted')}
                                options={getOptions('Attainment based on Weighted Average Method')}
                                plugins={[chartAreaBorder, barShadowPlugin]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Graph 3: Relative Weighted Average Method */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                <div className="w-full bg-white p-4 flex flex-col items-center">
                    <div className="w-full overflow-x-auto">
                        <div style={{ height: '320px', minWidth: `${minChartWidth}px`, width: '100%', margin: '0' }}>
                            <Bar
                                data={getChartDataForMethod('relative')}
                                options={getOptions('Attainment based on Relative Weighted Average Method')}
                                plugins={[chartAreaBorder, barShadowPlugin]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CAYPOChart;
