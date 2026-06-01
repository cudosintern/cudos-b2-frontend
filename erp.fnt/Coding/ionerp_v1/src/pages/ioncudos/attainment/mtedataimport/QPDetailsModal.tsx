import React, { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import styles from "./qpDetails.module.css";
import { useQpDetails } from "./useQpDetails";
import { QPQuestion, ChartData } from "./qpDetails.types";

interface QPDetailsModalProps {
  open: boolean;
  onClose: () => void;
  occasionId: string | null;
}

// Chart Colors - Updated to a more professional palette
const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#6366f1", "#ec4899", "#8b5cf6", "#f43f5e"];

const QPDetailsModal: React.FC<QPDetailsModalProps> = ({ open, onClose, occasionId }) => {
  const { data, loading } = useQpDetails(occasionId);

  // Calculate CO Distribution
  const calcCODistribution = (questions: QPQuestion[]): ChartData[] => {
    const dist: Record<string, number> = {};
    let totalMarks = 0;
    
    questions.forEach(q => {
      totalMarks += q.marks;
      const cos = q.cos.split(",").map(c => c.trim()).filter(Boolean);
      const weight = cos.length > 0 ? (q.marks / cos.length) : 0;
      
      cos.forEach(co => {
        dist[co] = (dist[co] || 0) + weight;
      });
    });

    return Object.entries(dist)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalMarks > 0 ? (value / totalMarks) * 100 : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  
  // Calculate Bloom's Level Distribution
  const calcLevelDistribution = (questions: QPQuestion[]): ChartData[] => {
    const dist: Record<string, number> = {};
    let totalMarks = 0;
    
    questions.forEach(q => {
      totalMarks += q.marks;
      const levels = q.level.split(",").map(l => l.trim()).filter(Boolean);
      const weight = levels.length > 0 ? (q.marks / levels.length) : 0;
      
      levels.forEach(level => {
        dist[level] = (dist[level] || 0) + weight;
      });
    });
    
    return Object.entries(dist)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalMarks > 0 ? (value / totalMarks) * 100 : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const coData = useMemo(() => data ? calcCODistribution(data.questions) : [], [data]);
  const levelData = useMemo(() => data ? calcLevelDistribution(data.questions) : [], [data]);
  
  const totalMarksSum = data?.questions.reduce((sum, q) => sum + q.marks, 0) || 0;

  if (!open) return null;

  const renderDistributionSection = (title: string, chartData: ChartData[]) => (
    <>
      <div className={styles.subDarkHeader}>{title}</div>
      <div className={styles.distributionContainer}>
        <div className={styles.chartSide}>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="40%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percentage }) => `${percentage.toFixed(2)}%`}
                  labelLine={true}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => val.toFixed(2)} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{fontSize: 12, color: '#888'}}>No Distribution Data</p>
          )}
        </div>
        <div className={styles.tableSide}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th className={styles.th}>{title.includes("CO") ? "CO Level" : "Bloom's Level"}</th>
                <th className={styles.th}>Marks Distribution (X)</th>
                <th className={styles.th}>% Distribution</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, i) => (
                <tr key={i}>
                  <td className={styles.td}>{row.name}</td>
                  <td className={styles.td}>{row.value.toFixed(2)}</td>
                  <td className={styles.td}>{row.percentage.toFixed(2)} %</td>
                </tr>
              ))}
              <tr className={styles.footerRow}>
                <td className={styles.td}>Total</td>
                <td className={styles.td}>{totalMarksSum.toFixed(2)} (Y)</td>
                <td className={styles.td}>
                   {totalMarksSum > 0 ? "100.00 %" : "0.00 %"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        
        {/* Top Header */}
        <div className={styles.darkHeader}>
          <span>MTE Question Paper</span>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
             <div style={{padding: '3rem', textAlign: 'center', color: '#666'}}>Loading QP data...</div>
          ) : !data ? (
             <div style={{padding: '3rem', textAlign: 'center', color: '#666'}}>No QP data available</div>
          ) : (
            <>
              {/* Metadata Section */}
              <div className={styles.metadataStrip}>
                <div><strong>Total Duration (H:M):</strong> {data.duration}</div>
                <div className={styles.metadataCenter}>
                  <strong>Question Paper Title:</strong> MTE<br/>
                  <strong>Course:</strong> {data.course.title} ({data.course.code})<br/>
                  <strong>Note:</strong>
                </div>
                <div><strong>Maximum Marks:</strong> {data.maxMarks.toFixed(2)}</div>
              </div>

              {/* Questions Table */}
              <div className={styles.paperContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Question No.</th>
                      <th className={styles.th}>Question</th>
                      <th className={styles.th}>COs</th>
                      <th className={styles.th}>Level</th>
                      <th className={styles.th}>PI Code</th>
                      <th className={styles.th}>Marks</th>
                    </tr>
                    <tr className={styles.sectionRow}>
                      <td className={styles.td} colSpan={4} style={{textAlign: 'left', paddingLeft: '16px'}}>Section 1</td>
                      <td className={styles.td} colSpan={1}>Section Marks: {totalMarksSum.toFixed(2)} / {data.maxMarks.toFixed(2)}</td>
                      <td className={styles.td} colSpan={1}>Grand Total Marks: {totalMarksSum.toFixed(2)} / {data.maxMarks.toFixed(2)}</td>
                    </tr>
                  </thead>
                  <tbody>
                    {data.questions.map((q, i) => (
                      <tr key={i}>
                        <td className={styles.td}>{q.questionNo}</td>
                        <td className={styles.td} style={{textAlign: 'left'}}>{q.text}</td>
                        <td className={styles.td}>{q.cos}</td>
                        <td className={styles.td}>{q.level}</td>
                        <td className={styles.td}>{q.piCode}</td>
                        <td className={styles.td} style={{textAlign: 'right'}}>{q.marks.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr className={styles.footerRow}>
                      <td className={styles.td} colSpan={5} style={{textAlign: 'right'}}>Grand Total Marks: </td>
                      <td className={styles.td} style={{textAlign: 'right'}}>{totalMarksSum.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* CO Distribution */}
              {renderDistributionSection("Course Outcome Marks Distribution", coData)}

              {/* Notes container directly underneath CO */}
              <div className={styles.notesContainer}>
                <div className={styles.notesTitle}>Note:</div>
                The above pie chart depicts the individual Course Outcome(CO) wise actual marks percentage distribution as in the question paper.<br/><br/>
                X = Individual Course Outcome marks<br/>
                Y = Sum of all Course Outcomes marks<br/>
                % Distribution = (X / Y) * 100
              </div>

              {/* Bloom's Level Distribution */}
              {renderDistributionSection("Bloom's Level Marks Distribution", levelData)}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕ Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default QPDetailsModal;
