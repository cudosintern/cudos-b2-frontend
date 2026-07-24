// src/pages/ioncudos/attainment/consolidatedPOAttainment/ConsolidatedPODrilldownModal.tsx

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { toast } from 'react-toastify';
import { X } from 'lucide-react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import ConsolidatedPOWebHelpModal from './ConsolidatedPOWebHelpModal';
import { fetchDrilldown, DrilldownRow } from './ConsolidatedPOApi';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

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

interface Props {
    open: boolean;
    onClose: () => void;
    poCode: string;
    poStatement: string;
    method: 'threshold' | 'weighted' | 'relative';
    curriculumId: number | null;
    termIds: number[];
    firstYearCurriculumId: number | null;
    poId: number | null;
}

const ConsolidatedPODrilldownModal: React.FC<Props> = ({
    open,
    onClose,
    poCode,
    poStatement,
    method,
    curriculumId,
    termIds,
    firstYearCurriculumId,
    poId
}) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<DrilldownRow[]>([]);
    const [poInfo, setPoInfo] = useState<{ po_reference: string, po_statement: string }>({
        po_reference: poCode,
        po_statement: poStatement
    });

    useEffect(() => {
        if (open && curriculumId !== null && poId !== null) {
            const loadData = async () => {
                setLoading(true);
                try {
                    // Map local UI method keys to backend parameters
                    const backendMethod = method === 'threshold' ? 'threshold_method' : method === 'weighted' ? 'weighted_average' : 'relative_weighted';
                    const res = await fetchDrilldown(
                        curriculumId,
                        termIds,
                        firstYearCurriculumId,
                        poId,
                        backendMethod
                    );
                    setRows(res.rows);
                    if (res.po) {
                        setPoInfo({
                            po_reference: res.po.po_reference || poCode,
                            po_statement: res.po.po_statement || poStatement
                        });
                    }
                } catch (err) {
                    console.error("Failed to load drilldown data:", err);
                    toast.error("Failed to load drilldown details.");
                } finally {
                    setLoading(false);
                }
            };
            loadData();
        } else {
            setRows([]);
        }
    }, [open, curriculumId, termIds, firstYearCurriculumId, poId, method, poCode, poStatement]);

    // Resolve color based on method
    const getMethodColor = (): string => {
        if (method === 'threshold') return '#5FA9B2';
        if (method === 'weighted') return '#A8B3BC';
        return '#4F84A7';
    };

    // Extract values based on selected calculation method
    const getMethodValue = (r: DrilldownRow): number => {
        const val = method === 'threshold'
            ? r.threshold_po_direct_attainment
            : method === 'weighted'
                ? r.hml_weighted_average_da
                : r.hml_weighted_multiply_maplevel_da;
        if (val === null || val === undefined || val === "" || val === "-") {
            return 0;
        }
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    };

    const getMethodValueDisplay = (r: DrilldownRow): string => {
        const val = method === 'threshold'
            ? r.threshold_po_direct_attainment
            : method === 'weighted'
                ? r.hml_weighted_average_da
                : r.hml_weighted_multiply_maplevel_da;
        if (val === null || val === undefined || val === "" || val === "-") {
            return "-";
        }
        if (typeof val === 'number') {
            return `${val.toFixed(2)} %`;
        }
        const str = String(val).trim();
        if (str === "0" || str === "0.0" || str === "0.00" || str === "-") {
            return "-";
        }
        if (str.includes('%')) {
            return str;
        }
        return `${str} %`;
    };

    const getMethodLevelDisplay = (r: DrilldownRow): string => {
        const val = method === 'threshold'
            ? r.threshold_po_attainment_level
            : method === 'weighted'
                ? r.hml_wtd_avg_attainment_level
                : r.hml_wtd_avg_mul_attainment_level;
        if (val === null || val === undefined || val === "") {
            return "-";
        }
        if (typeof val === 'number') {
            return val.toFixed(2);
        }
        return String(val).trim();
    };

    const chartLabels = rows.map(r => r.crs_code);
    const chartValues = rows.map(r => getMethodValue(r));

    // Pad to align bars to the left
    const minColumns = 10;
    const paddedLabels = [...chartLabels];
    while (paddedLabels.length < minColumns) {
        paddedLabels.push("");
    }
    const paddedValues = [...chartValues];
    while (paddedValues.length < minColumns) {
        paddedValues.push(null as any);
    }

    const chartData = {
        labels: paddedLabels,
        datasets: [
            {
                label: 'PO Attainment %',
                data: paddedValues,
                backgroundColor: getMethodColor(),
                borderColor: getMethodColor(),
                borderWidth: 1,
                borderRadius: 0,
                maxBarThickness: 18,
                categoryPercentage: 0.8,
                barPercentage: 0.8,
                datalabels: {
                    display: true,
                    anchor: 'end' as const,
                    align: 'top' as const,
                    offset: 4,
                    color: '#333',
                    font: { weight: 'bold' as const, size: 10 },
                    formatter: (value: any) => (value !== null && value !== undefined && !isNaN(value)) ? value.toFixed(2) : "",
                },
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            tooltip: {
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: (context: any) => {
                        const val = context.parsed.y;
                        if (val === null || val === undefined) return '';
                        const crsTitle = rows[context.dataIndex]?.crs_title || '';
                        return [
                            `Course: ${crsTitle}`,
                            `PO Statement: ${poInfo.po_statement}`,
                            `Value: ${val.toFixed(2)}%`
                        ];
                    }
                }
            },
            legend: { display: false }
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
                grid: { color: '#e5e7eb' },
                border: { display: false }
            },
            x: {
                ticks: {
                    color: '#666666',
                    font: { size: 11 },
                    autoSkip: false,
                    maxRotation: 0,
                    minRotation: 0,
                },
                grid: {
                    color: '#e5e7eb',
                    offset: true
                },
                border: { display: false }
            }
        },
        layout: { padding: { top: 20, bottom: 5, left: 10, right: 10 } }
    };

    // Method title mapping for the third table column
    const methodHeaderMap = {
        threshold: 'Threshold based (Average) Attainment %',
        weighted: 'Weighted Average Attainment %',
        relative: 'Relative Weighted Average Attainment %'
    };

    return (
        <>
            <ModalContainer
                isOpen={open}
                onClose={onClose}
                title="Program Outcome Attainment by individual courses"
                size="5xl"
                onHelpClick={() => setIsHelpOpen(true)}
            >
            <div className="text-left space-y-6 max-h-[65vh] overflow-y-auto pr-2">
                {/* Header Information Bar */}
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
                    <span className="text-sm font-semibold text-gray-700">
                        Program Outcome : <span className="text-blue-600 font-bold">{poInfo.po_reference}</span>. PO Statement: <span className="text-blue-600 font-bold">{poInfo.po_statement}</span>
                    </span>
                </div>

                {loading ? (
                    <div className="py-20 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-500">Loading drilldown data...</span>
                    </div>
                ) : (
                    <>
                        {/* Graph Area */}
                        <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch border border-gray-200 rounded-lg p-4 bg-white shadow-sm justify-start">
                            <div className="flex-grow overflow-x-auto min-h-[220px]">
                                <div style={{ height: '220px', minWidth: `${Math.max(450, paddedLabels.length * 120)}px`, width: '100%' }}>
                                    <Bar
                                        data={chartData}
                                        options={chartOptions}
                                        plugins={[chartAreaBorder, barShadowPlugin, ChartDataLabels]}
                                    />
                                </div>
                            </div>
                            <div className="w-[160px] shrink-0 border border-gray-300 rounded p-4 bg-[#fcfcfc] self-center text-xs font-semibold text-gray-700 flex flex-col gap-2.5 shadow-sm text-left">
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="inline-block w-4 h-3.5 shadow-sm shrink-0 border"
                                        style={{ backgroundColor: getMethodColor(), borderColor: getMethodColor() }}
                                    />
                                    <span className="leading-tight">PO Attainment %</span>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-center border-collapse">
                                    <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                        <tr>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Curriculum</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">Course Code - Course Title</th>
                                            <th className="px-3 py-3 border-r border-slate-200 text-center">{methodHeaderMap[method]}</th>
                                            <th className="px-3 py-3 text-center">Attainment Level</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200">
                                        {rows.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-slate-500 font-medium text-center">
                                                    No courses found contributing to this Program Outcome (PO).
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row) => (
                                                <tr key={row.crs_code} className="hover:bg-slate-50 transition-colors text-sm">
                                                    <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">
                                                        {row.crclm_name}
                                                    </td>
                                                    <td className="px-3 py-2.5 border-r border-slate-100 text-center">
                                                        <span className="text-blue-600 font-bold">
                                                            {row.crs_code}
                                                        </span>
                                                        <span className="text-slate-600 font-medium"> - {row.crs_title}</span>
                                                    </td>
                                                    <td className="px-3 py-2.5 border-r border-slate-100 text-center text-slate-800 font-semibold">
                                                        {getMethodValueDisplay(row)}
                                                    </td>
                                                    <td className="px-3 py-2.5 text-center text-slate-800 font-semibold">
                                                        {getMethodLevelDisplay(row)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Bottom Note Section */}
                <div className="p-4 border border-gray-200 bg-[#f8f8f6] rounded-lg text-sm text-left shadow-sm">
                    <div className="font-bold text-gray-800 mb-2">Note:</div>
                    <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-600">
                        <li>If PO Attainment % and Attainment Level are blank, it indicates that CO attainment for the respective courses are not finalized for calculating PO attainment.</li>
                        <li>The above bar graph depicts individual PO attainment contributed by courses under selected Terms (Semester).</li>
                    </ul>
                </div>

                {/* Bottom Red Close Button */}
                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition active:scale-95 shadow-sm"
                    >
                        <X size={14} className="stroke-[3]" /> Close
                    </button>
                </div>
            </div>
            </ModalContainer>

            {/* Support Help Modal */}
            <ConsolidatedPOWebHelpModal
                open={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </>
    );
};

export default ConsolidatedPODrilldownModal;
