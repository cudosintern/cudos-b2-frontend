import React, { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Customized,
  LabelList,
  Legend,
  TooltipProps,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { PoAttainmentResponse } from "./poAttainmentTypes";

interface PoAttainmentChartProps {
  chart: PoAttainmentResponse["data"]["chart"];
}

interface GroupSeparatorProps {
  offset?: {
    height: number;
    left: number;
    top: number;
    width: number;
  };
}

const CompactTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
  active,
  label,
  payload,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        border: "1px solid #dbe4ee",
        borderRadius: "6px",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.12)",
        color: "#334155",
        fontSize: "11px",
        lineHeight: 1.35,
        padding: "6px 8px",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: "2px" }}>{label}</div>
      {payload.map((item) => (
        <div
          key={String(item.name)}
          style={{ alignItems: "center", display: "flex", gap: "6px", whiteSpace: "nowrap" }}
        >
          <span
            style={{
              backgroundColor: item.color,
              borderRadius: "999px",
              display: "inline-block",
              height: "8px",
              width: "8px",
            }}
          />
          <span>{item.name}</span>
          <span style={{ fontWeight: 600 }}>{Number(item.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

const GroupSeparators: React.FC<GroupSeparatorProps & { groupCount: number }> = ({
  offset,
  groupCount,
}) => {
  if (!offset || groupCount < 2) {
    return null;
  }

  const separatorPoints = Array.from({ length: groupCount - 1 }, (_, index) => {
    return offset.left + (offset.width * (index + 1)) / groupCount;
  });

  return (
    <g>
      {separatorPoints.map((xPosition) => (
        <line
          key={xPosition}
          x1={xPosition}
          x2={xPosition}
          y1={offset.top}
          y2={offset.top + offset.height}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
      ))}
    </g>
  );
};

const PoAttainmentChart: React.FC<PoAttainmentChartProps> = ({ chart }) => {
  const data = useMemo(() => {
    return chart.categories.map((category, index) => {
      const entry: Record<string, string | number> = { category };

      chart.series.forEach((series) => {
        entry[series.name] = series.data[index];
      });

      return entry;
    });
  }, [chart]);

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 28, right: 16, left: 0, bottom: 16 }}
          barCategoryGap="34%"
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <Customized component={<GroupSeparators groupCount={data.length} />} />
          <XAxis dataKey="category" tick={{ fontSize: 12, fill: "#475569", fontWeight: 600 }} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <Tooltip
            content={<CompactTooltip />}
            cursor={false}
            wrapperStyle={{ outline: "none" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          {chart.series.map((series, seriesIndex) => (
            <Bar
              key={series.name}
              dataKey={series.name}
              fill={series.color}
              radius={[4, 4, 0, 0]}
              barSize={16}
              maxBarSize={16}
            >
              <LabelList
                dataKey={series.name}
                content={({ value, x, y, width }) => {
                  if (
                    typeof value !== "number" ||
                    typeof x !== "number" ||
                    typeof y !== "number" ||
                    typeof width !== "number"
                  ) {
                    return null;
                  }

                  const horizontalOffset =
                    (seriesIndex - (chart.series.length - 1) / 2) * 10;
                  const verticalOffset = 10 + (seriesIndex % 2 === 0 ? 0 : 8);

                  return (
                    <text
                      x={x + width / 2 + horizontalOffset}
                      y={y - verticalOffset}
                      textAnchor="middle"
                      style={{ fill: "#475569", fontSize: 10, fontWeight: 500 }}
                    >
                      {value.toFixed(2)}
                    </text>
                  );
                }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PoAttainmentChart;
