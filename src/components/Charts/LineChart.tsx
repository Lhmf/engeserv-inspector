import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from "recharts";
import { cn } from "@/lib/utils";

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  data: LineChartData[];
  lines: { dataKey: string; name: string; color?: string; strokeWidth?: number; type?: "line" | "area" }[];
  width?: number | string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

export function LineChartComponent({
  data,
  lines,
  width = "100%",
  height = 300,
  className,
  showLegend = true,
  tooltipFormatter,
}: LineChartProps) {
  const defaultColors = [
    "#0f172a", // navy
    "#0ea5e9", // sky
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
  ];

  // Formatter compatível com Recharts
  const formatter = tooltipFormatter
    ? (value: any, name: any, ...rest: any[]) => tooltipFormatter(value ?? 0, name ?? "")
    : (value: any, name: any, ...rest: any[]) => [
        value?.toLocaleString?.("pt-BR") ?? value,
        name ?? "",
      ];

  return (
    <div className={cn("w-full", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: showLegend ? 30 : 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
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
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || defaultColors[index % defaultColors.length]}
              strokeWidth={line.strokeWidth || 2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}