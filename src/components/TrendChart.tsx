"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatValue } from "@/lib/format";
import type { TrendSlide } from "@/lib/trends-data";

function CustomTooltip(props: any) {
  const { active, payload, label, unit } = props;
  if (active && payload && payload.length) {
    const value = payload[0].value as number;
    const dataKey = payload[0].name as string;

    return (
      <div className="bg-[var(--surface-1)] border border-[var(--border-hairline)] rounded-md px-3 py-2 text-[14px] shadow-sm flex flex-col gap-1">
        <span className="text-[var(--text-muted)] font-medium">{label}</span>
        <span className="text-[var(--foreground)] font-semibold">
          {dataKey}: {formatValue(value, unit)}
        </span>
      </div>
    );
  }
  return null;
}

export default function TrendChart({ slide }: { slide: TrendSlide }) {
  const chartProps = useMemo(() => {
    return {
      data: slide.data,
      margin: { top: 8, right: 8, bottom: 0, left: 0 },
    };
  }, [slide.data]);

  const yAxisFormatter = (value: number) => {
    return formatValue(value, "").replace(/\$|Bs\.\s?/, "");
  };

  const renderChart = () => {
    switch (slide.kind) {
      case "line":
        return (
          <LineChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gridline)" />
            <XAxis dataKey="label" stroke="var(--axis)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis width={60} stroke="var(--axis)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip unit={slide.unit} />} cursor={{ stroke: "var(--axis)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Line type="monotone" dataKey="value" name={slide.metricLabel} stroke={slide.color} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "var(--surface-1)", strokeWidth: 2, fill: slide.color }} />
          </LineChart>
        );
      case "area":
        return (
          <AreaChart {...chartProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gridline)" />
            <XAxis dataKey="label" stroke="var(--axis)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis width={60} stroke="var(--axis)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip unit={slide.unit} />} cursor={{ stroke: "var(--axis)", strokeWidth: 1, strokeDasharray: "4 4" }} />
            <Area type="monotone" dataKey="value" name={slide.metricLabel} stroke={slide.color} fill={slide.softColor} strokeWidth={2} activeDot={{ r: 5, stroke: "var(--surface-1)", strokeWidth: 2, fill: slide.color }} />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart {...chartProps} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gridline)" />
            <XAxis dataKey="label" stroke="var(--axis)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis width={60} stroke="var(--axis)" tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={yAxisFormatter} />
            <Tooltip content={<CustomTooltip unit={slide.unit} />} cursor={{ fill: "var(--gridline)", opacity: 0.5 }} />
            <Bar dataKey="value" name={slide.metricLabel} fill={slide.color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full min-h-0" role="img" aria-label={`Gráfico de ${slide.title}`}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
