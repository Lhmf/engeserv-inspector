import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

interface BarChartData {
  name: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  width?: number | string;
  height?: number;
  xKey?: string;
  yKey?: string;
  className?: string;
  showLegend?: boolean;
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

export function BarChartComponent({
  data,
  width = "100%",
  height = 280,
  xKey = "name",
  yKey = "value",
  className,
  showLegend = false,
  tooltipFormatter,
}: BarChartProps) {
  const defaultColors = [
    "#0f172a", // navy
    "#0ea5e9", // sky
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
    "#06b6d4", // cyan
  ];

  // Formatter compatível com Recharts - aceita value | undefined
  const formatter = tooltipFormatter
    ? (value: any, name: any, ...rest: any[]) => tooltipFormatter(value ?? 0, name ?? "")
    : (value: any, name: any, ...rest: any[]) => [
        value?.toLocaleString?.("pt-BR") ?? value,
        name ?? "",
      ];

  return (
    <div className={cn("w-full", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            type="number"
            dataKey={yKey}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey={xKey}
            tick={{ fontSize: 12, fill: "#334155" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelStyle={{ color: "#334155", fontWeight: 600 }}
            formatter={formatter}
          />
          {showLegend && <Legend />}
          <Bar
            dataKey={yKey}
            radius={[0, 4, 4, 0]}
            maxBarSize={40}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors[index % defaultColors.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}