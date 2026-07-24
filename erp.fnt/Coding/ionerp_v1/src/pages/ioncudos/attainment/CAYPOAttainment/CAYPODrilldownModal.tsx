import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { X } from 'lucide-react';
import ModalContainer from '../../../../components/Modal/ModalContainer';
import CAYPOWebHelpModal from './CAYPOWebHelpModal';
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
    Legend
);

interface Props {
    open: boolean;
    onClose: () => void;
    poCode: string;
    seriesName: string;
    method: 'threshold' | 'weighted' | 'relative';
    clickedPct: number;
}

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

const CAYPODrilldownModal: React.FC<Props> = ({
    open,
    onClose,
    poCode,
    seriesName,
    method,
    clickedPct
}) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    // Map method names for headers
    const methodHeaderMap = {
        threshold: 'Attainment based on Threshold method %',
        weighted: 'Attainment based on Weighted Average Method %',
        relative: 'Attainment based on Relative Weighted Average Method %'
    };

    // Calculate level based on percentage using standard mapping
    const calculateLevel = (pct: number) => {
        if (pct >= 70) return 3.00;
        if (pct >= 50) return 2.00;
        if (pct >= 35) return 1.00;
        return 0.00;
    };

    // Parse Semesters from seriesName
    const semesters: string[] = [];
    if (seriesName.includes('1 - Semester')) semesters.push('1 - Semester');
    if (seriesName.includes('2 - Semester')) semesters.push('2 - Semester');
    if (seriesName.includes('3 - Semester')) semesters.push('3 - Semester');
    if (seriesName.includes('4 - Semester')) semesters.push('4 - Semester');
    if (semesters.length === 0) {
        // Fallback semesters
        semesters.push('1 - Semester', '2 - Semester');
    }

    // Generate 1-2 realistic mock courses matching semesters
    const mockCoursesData = semesters.map((sem, idx) => {
        // First course matches clickedPct exactly for alignment
        const pct = idx === 0 ? clickedPct : Math.min(100, Math.max(10, clickedPct * 1.08));
        const courseCode = `Course${101 + idx}`;
        const courseTitle = idx === 0 ? 'Programming in C & Data Structures' : 'Database Management Systems & Lab';
        
        return {
            semester: sem,
            code: courseCode,
            title: courseTitle,
            value: pct,
            level: calculateLevel(pct)
        };
    });

    const chartLabels = mockCoursesData.map((c) => c.code);
    const chartValues = mockCoursesData.map((c) => c.value);

    // Chart JS settings matching the reference image layout
    const chartData = {
        labels: chartLabels,
        datasets: [
            {
                label: 'Attainment %',
                data: chartValues,
                backgroundColor: '#5FA9B2', // Theme color matching Series 1
                borderColor: '#4E939B',
                borderWidth: 1,
                borderRadius: 0,
                maxBarThickness: 38,
                categoryPercentage: 0.7,
                barPercentage: 0.8,
                datalabels: {
                    display: true,
                    anchor: 'end' as const,
                    align: 'top' as const,
                    offset: 4,
                    color: '#333',
                    font: { weight: 'bold' as const, size: 11 },
                    formatter: (value: number) => `${value.toFixed(2)}`,
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
                        const index = context.dataIndex;
                        const course = mockCoursesData[index];
                        return ` ${course.code}: ${course.title} (${course.value.toFixed(2)}%)`;
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
                    padding: 10
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
                    color: '#666',
                    font: { size: 11 }
                },
                grid: { color: '#f1f5f9' },
                border: { display: false }
            },
            x: {
                ticks: {
                    color: '#666',
                    font: { size: 11, weight: 'bold' as const }
                },
                grid: { display: false },
                border: { display: false }
            }
        },
        layout: { padding: { top: 20, bottom: 5, left: 10, right: 10 } }
    };

    const poNumber = poCode.replace('PO', '');

    return (
        <>
            <ModalContainer
                isOpen={open}
                onClose={onClose}
                title="Program Outcome Attainment by individual Course"
                size="5xl"
                onHelpClick={() => setIsHelpOpen(true)}
            >
                <div className="text-left space-y-6 max-h-[75vh] overflow-y-auto pr-2">
                    {/* Header Details */}
                    <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-700">
                            Curriculum : <span className="font-normal text-gray-600">{seriesName}</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-800">
                            {poCode} : PO Statement: {poNumber}
                        </div>
                    </div>

                    {/* Chart Box */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-2">
                        <div className="w-full bg-white p-4 flex flex-col items-center">
                            <div className="w-full overflow-x-auto">
                                <div style={{ height: '280px', minWidth: '400px', width: '100%', margin: '0' }}>
                                    <Bar
                                        data={chartData}
                                        options={chartOptions}
                                        plugins={[chartAreaBorder, barShadowPlugin, ChartDataLabels]}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left-Aligned Grouped Data Table */}
                    <div className="border border-slate-300 rounded-md overflow-hidden bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-100 text-[11px] text-slate-700 uppercase font-bold border-b border-slate-300">
                                    <tr>
                                        <th className="px-3 py-3 border-r border-slate-200 text-left pl-3">Course</th>
                                        <th className="px-3 py-3 border-r border-slate-200 text-left pl-3">{methodHeaderMap[method]}</th>
                                        <th className="px-3 py-3 text-left pl-3">Attainment Level</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {mockCoursesData.map((course) => (
                                        <React.Fragment key={course.code}>
                                            {/* Term Grouping Header */}
                                            <tr className="bg-slate-50 font-bold text-xs text-gray-700">
                                                <td colSpan={3} className="px-3 py-2 text-left pl-3 border-b border-slate-200">
                                                    {course.semester}
                                                </td>
                                            </tr>
                                            {/* Course Row */}
                                            <tr className="hover:bg-slate-50 transition-colors text-sm">
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-left pl-3 text-slate-700">
                                                    {course.code}
                                                </td>
                                                <td className="px-3 py-2.5 border-r border-slate-100 text-left pl-3 text-slate-800 font-semibold">
                                                    {course.value.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2.5 text-left pl-3 text-slate-800 font-semibold">
                                                    {course.level.toFixed(2)}
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Bottom Red Close Button */}
                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-semibold transition active:scale-95 shadow-sm"
                        >
                            <span className="font-bold">X</span> Close
                        </button>
                    </div>
                </div>
            </ModalContainer>

            <CAYPOWebHelpModal
                open={isHelpOpen}
                onClose={() => setIsHelpOpen(false)}
            />
        </>
    );
};

export default CAYPODrilldownModal;
