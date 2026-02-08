import { Table, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DataPreview as DataPreviewType } from "@/lib/parseResults";

interface DataPreviewProps {
  dataPreview: DataPreviewType;
}

const DataPreview = ({ dataPreview }: DataPreviewProps) => {
  const { columns, rows, stats, distributions } = dataPreview;

  // Get first 3 numeric columns for distribution charts
  const numericColumns = Object.entries(stats)
    .filter(([_, stat]) => stat.type === "numeric")
    .slice(0, 3)
    .map(([col]) => col);

  return (
    <div className="space-y-4">
      {/* Data Table Preview */}
      {columns.length > 0 && rows.length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Table className="h-4 w-4 text-primary" />
              Data Preview (First 5 Rows)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {columns.map((col, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      {row.map((cell, cellIdx) => (
                        <td
                          key={cellIdx}
                          className="px-3 py-2 text-foreground whitespace-nowrap"
                        >
                          {cell !== null
                            ? typeof cell === "number"
                              ? cell.toFixed(2)
                              : String(cell)
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Statistics */}
      {Object.keys(stats).length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Column Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Object.entries(stats).map(([col, stat]) => (
                <div
                  key={col}
                  className="p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
                      {col}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        stat.type === "numeric"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-purple-500/20 text-purple-400"
                      }`}
                    >
                      {stat.type}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Count</span>
                      <span className="text-foreground">{stat.count}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Missing</span>
                      <span
                        className={
                          stat.missing > 0 ? "text-yellow-400" : "text-foreground"
                        }
                      >
                        {stat.missing}
                      </span>
                    </div>
                    {stat.type === "numeric" ? (
                      <>
                        <div className="flex justify-between">
                          <span>Mean</span>
                          <span className="text-foreground">
                            {stat.mean != null ? stat.mean.toFixed(2) : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Min / Max</span>
                          <span className="text-foreground">
                            {stat.min != null ? stat.min.toFixed(2) : "N/A"} / {stat.max != null ? stat.max.toFixed(2) : "N/A"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between">
                        <span>Unique</span>
                        <span className="text-foreground">{stat.unique}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Distributions */}
      {numericColumns.length > 0 && Object.keys(distributions).length > 0 && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Feature Distributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {numericColumns.map((col) => {
                const distData = distributions[col];
                if (!distData || distData.length === 0) return null;

                return (
                  <div
                    key={col}
                    className="p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="text-sm font-medium text-foreground mb-2 truncate">
                      {col}
                    </div>
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={distData}
                          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                        >
                          <XAxis
                            dataKey="bin"
                            tick={false}
                            stroke="hsl(var(--border))"
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                            stroke="hsl(var(--border))"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "6px",
                              color: "hsl(var(--foreground))",
                              fontSize: "12px",
                            }}
                            formatter={(value: number) => [value, "Count"]}
                            labelFormatter={(label) => `Range: ${label}`}
                          />
                          <Bar
                            dataKey="count"
                            fill="hsl(var(--primary))"
                            radius={[2, 2, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DataPreview;
