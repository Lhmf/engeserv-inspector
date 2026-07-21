import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartData[];
  width?: number | string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  tooltipFormatter?: (value: number, name: string) => [string, string];
}

export function PieChartComponent({
  data,
  width = "100%",
  height = 280,
  className,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
  tooltipFormatter,
}: PieChartProps) {
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

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={cn("w-full flex flex-col items-center", className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(1) : 0}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || defaultColors[index % defaultColors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={tooltipFormatter
              ? (value: any, name: any, ...rest: any[]) => tooltipFormatter(value ?? 0, name ?? "")
              : (value: any, name: any, ...rest: any[]) => [
                  `${(value ?? 0).toLocaleString?.("pt-BR") ?? value} (${(((value ?? 0) / (total || 1)) * 100).toFixed(1)}%)`,
                  name ?? "",
                ]}
          />
          {showLegend && (
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={10}
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
      {total > 0 && (
        <div className="mt-4 text-center">
          <p className="text-3xl font-bold text-navy">{total.toLocaleString("pt-BR")}</p>
          <p className="text-sm text-slate-500">Total</p>
        </div>
      )}
    </div>
  );
}