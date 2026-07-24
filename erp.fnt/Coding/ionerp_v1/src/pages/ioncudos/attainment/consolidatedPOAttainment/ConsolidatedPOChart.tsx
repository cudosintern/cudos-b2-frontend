// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPOChart.tsx

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
import { POConsolidatedAttainmentData } from './ConsolidatedPOApi';

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

// Custom plugin to draw a drop shadow on the bars matching the style
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

interface ConsolidatedPOChartProps {
    id?: string;
    data: POConsolidatedAttainmentData[];
    isFirstYear?: boolean;
    enabledMethods?: any[];
    onBarClick: (poId: number, poCode: string, method: 'threshold' | 'weighted' | 'relative', poStatement: string) => void;
}

const ConsolidatedPOChart: React.FC<ConsolidatedPOChartProps> = ({ id, data, isFirstYear = false, enabledMethods = [], onBarClick }) => {
    const labels = data.map((d) => d.po_code.replace('PO', ''));

    const showThreshold = enabledMethods.length === 0 || enabledMethods.some(m => m.id === 'threshold_method');
    const showWeighted = enabledMethods.length === 0 || enabledMethods.some(m => m.id === 'weighted_average');
    const showRelative = enabledMethods.length === 0 || enabledMethods.some(m => m.id === 'relative_weighted');

    // Series definitions with matching Image 2 colors built dynamically
    const seriesList = [];
    if (isFirstYear) {
        seriesList.push({
            name: 'Avg PO Attainment %',
            data: data.map((d) => d.avg_po_attainment),
            color: '#5FA9B2',
            methodKey: 'threshold' as const
        });
    } else {
        if (showThreshold) {
            seriesList.push({
                name: 'Avg PO Attainment %',
                data: data.map((d) => d.threshold_pct),
                color: '#5FA9B2',
                methodKey: 'threshold' as const
            });
        }
        if (showWeighted) {
            seriesList.push({
                name: 'Average - Map Level Weighted Attainment %',
                data: data.map((d) => d.weighted_pct),
                color: '#A8B3BC',
                methodKey: 'weighted' as const
            });
        }
        if (showRelative) {
            seriesList.push({
                name: 'PO Attainment %',
                data: data.map((d) => d.relative_pct),
                color: '#4F84A7',
                methodKey: 'relative' as const
            });
        }
    }

    // Pad to align bars to the left
    const minColumns = 10;
    const paddedLabels = [...labels];
    while (paddedLabels.length < minColumns) {
        paddedLabels.push("");
    }

    const paddedDatasets = seriesList.map((s) => {
        const paddedData = [...s.data];
        while (paddedData.length < minColumns) {
            paddedData.push(null as any);
        }
        return {
            label: s.name,
            data: paddedData,
            backgroundColor: s.color,
            borderColor: s.color,
            borderWidth: 1,
            borderRadius: 0,
            maxBarThickness: 18,
            categoryPercentage: 0.8,
            barPercentage: 0.8,
            methodKey: s.methodKey,
            datalabels: {
                display: true as const,
                anchor: 'end' as const,
                align: 'top' as const,
                offset: 4,
                color: '#333',
                font: { weight: 'bold' as const, size: 10 },
                formatter: (value: any) => (value !== null && value !== undefined && !isNaN(value)) ? value.toFixed(2) : "",
            },
        };
    });

    const chartData = {
        labels: paddedLabels,
        datasets: paddedDatasets,
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event: any, elements: any[]) => {
            if (elements && elements.length > 0) {
                const element = elements[0];
                const index = element.index;
                const datasetIndex = element.datasetIndex;
                const label = chartData.labels[index];
                if (label) {
                    const row = data.find(d => d.po_code.replace('PO', '') === label || d.po_code === label);
                    if (row) {
                        const method = chartData.datasets[datasetIndex]?.methodKey || 'threshold';
                        onBarClick(row.po_id, row.po_code, method, row.po_statement);
                    }
                }
            }
        },
        plugins: {
            tooltip: {
                mode: 'nearest' as const,
                intersect: true,
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: (context: any) => {
                        const val = context.parsed.y;
                        if (val === null || val === undefined) return '';
                        const labelVal = context.label;
                        const row = data.find(d => d.po_code.replace('PO', '') === labelVal || d.po_code === labelVal);
                        const statement = row ? row.po_statement : '';
                        return [
                            `Metric: ${context.dataset.label}`,
                            `PO Statement: ${statement}`,
                            `Value: ${val.toFixed(2)}%`
                        ];
                    },
                },
            },
            legend: {
                display: false, // We render a custom HTML legend box on the right
            },
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
                    maxRotation: 0,
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
        <div className="w-full bg-white p-4 flex flex-col lg:flex-row gap-6 items-stretch justify-start">
            {/* Chart Area */}
            <div className="flex-grow overflow-x-auto min-h-[320px]">
                <div style={{ height: '320px', minWidth: `${minChartWidth}px`, width: '100%', margin: '0' }}>
                    <Bar id={id || "consolidated-po-chart-canvas"} data={chartData} options={options} plugins={[chartAreaBorder, barShadowPlugin, ChartDataLabels]} />
                </div>
            </div>

            {/* Custom Legend Area on the right */}
            <div className="w-[200px] shrink-0 border border-gray-300 rounded p-4 bg-[#fcfcfc] self-center text-xs font-semibold text-gray-700 flex flex-col gap-2.5 shadow-sm text-left">
                {isFirstYear ? (
                    <div className="flex items-center gap-2">
                        <span className="inline-block w-4 h-3.5 bg-[#5FA9B2] border border-[#4ea1ab] shadow-sm shrink-0" />
                        <span className="leading-tight">Avg PO Attainment</span>
                    </div>
                ) : (
                    <>
                        {showThreshold && (
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-3.5 bg-[#5FA9B2] border border-[#4ea1ab] shadow-sm shrink-0" />
                                <span className="leading-tight">Avg PO Attainment %</span>
                            </div>
                        )}
                        {showWeighted && (
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-3.5 bg-[#A8B3BC] border border-[#97a4ad] shadow-sm shrink-0" />
                                <span className="leading-tight">Average - Map Level Weighted Attainment %</span>
                            </div>
                        )}
                        {showRelative && (
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-3.5 bg-[#4F84A7] border border-[#3F7194] shadow-sm shrink-0" />
                                <span className="leading-tight">PO Attainment %</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConsolidatedPOChart;
