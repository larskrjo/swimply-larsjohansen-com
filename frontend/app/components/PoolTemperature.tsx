import {
    Area,
    CartesianGrid,
    ComposedChart,
    LabelList,
    Legend,
    Line,
    ResponsiveContainer,
    Tooltip,
    type TooltipProps,
    XAxis,
    YAxis,
} from "recharts";
import type {NameType, ValueType} from "recharts/types/component/DefaultTooltipContent";
import type {TemperatureGraphItem} from "~/types/temperature-types";
import TemperatureButton from "~/components/TemperatureButton";
import {useState} from "react";
import {celsiusToFahrenheit} from "~/utils/graph-utils";

export default function PoolTemperature(props: { data: TemperatureGraphItem[], min: number, max: number }) {
    const [temperatureType, setTemperatureType] = useState("Fahrenheit");

    const scaleAdjustedData: TemperatureGraphItem[] = JSON.parse(JSON.stringify(props.data));
    let scaleAdjustedMin = props.min;
    let scaleAdjustedMax = props.max;
    switch (temperatureType) {
        case "Fahrenheit":
            scaleAdjustedMin = Number(celsiusToFahrenheit(scaleAdjustedMin).toFixed(1));
            scaleAdjustedMax = Number(celsiusToFahrenheit(scaleAdjustedMax).toFixed(1));

            scaleAdjustedData.forEach(temperature => {
                temperature.min = Number(celsiusToFahrenheit(temperature.min).toFixed(1));
                temperature.max = Number(celsiusToFahrenheit(temperature.max).toFixed(1));
                temperature.value = Number(celsiusToFahrenheit(temperature.value).toFixed(1));
            });
            break;
        case "Celsius":
            scaleAdjustedMin = Number(scaleAdjustedMin.toFixed(1));
            scaleAdjustedMax = Number(scaleAdjustedMax.toFixed(1));

            scaleAdjustedData.forEach(temperature => {
                temperature.min = Number(temperature.min.toFixed(1));
                temperature.max = Number(temperature.max.toFixed(1));
                temperature.value = Number(temperature.value.toFixed(1));
            });
            break;
    }

    return (
        <div style={{ width: 800, height: 400 }}>
            <h2 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
                Swimming Pool Temperature
            </h2>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={scaleAdjustedData} margin={{ top: 12, right: 16, bottom: 8, left: 12 }}>
                    <defs>
                        {/* subtle gradient for the band */}
                        <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="x" tickMargin={8} />
                    <YAxis   yAxisId="temp"
                             type="number"
                             domain={[Math.floor(scaleAdjustedMin) - 2, Math.ceil(scaleAdjustedMax) + 2]}
                             tickFormatter={(value) => `${value}${temperatureType == 'Celsius' ? '°C' : '°F'}`}
                             tickMargin={10}
                             tick={{ fontSize: 14 }}
                             allowDataOverflow />
                    <Legend
                        align="center"
                        verticalAlign="bottom"
                        layout="horizontal"
                        wrapperStyle={{ width: "100%", paddingTop: 6 }}
                        content={LegendContent}
                    />
                    <Tooltip
                        content={(p) => <TooltipContent {...p} />}
                        labelStyle={{ fontWeight: 600 }}
                        contentStyle={{ borderRadius: 12, border: "1px solid #eee" }}
                    />

                    {/* --- Band between min and max via stacking --- */}
                    {/* 1) invisible base at "min" */}
                    <Area
                        yAxisId="temp"
                        type="monotone"
                        dataKey="min"
                        stackId="band"
                        stroke="none"
                        fill="transparent"
                        activeDot={false}
                        dot={false}
                    />
                    {/* 2) visible 'range' stacked on top of min: (max - min) */}
                    <Area
                        yAxisId="temp"
                        type="monotone"
                        // accessor function: range = max - min
                        dataKey={(d: TemperatureGraphItem) => d.max - d.min}
                        name="range"
                        stackId="band"
                        stroke="none"
                        fill="url(#band)"
                        isAnimationActive
                        dot={false}
                    />

                    {/* Optional thin outlines for min/max */}
                    <Line yAxisId="temp" type="monotone" dataKey="min" name="Min" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />
                    <Line yAxisId="temp" type="monotone" dataKey="max" name="Max" stroke="#94a3b8" strokeDasharray="4 4" dot={false} />

                    {/* The specific value inside the band */}
                    <Line
                        yAxisId="temp"
                        type="monotone"
                        dataKey="value"
                        name="Temp @ 2pm"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        isAnimationActive={false}
                    >
                        <LabelList
                            content={(p) => {
                                const { x, y, value } = p as any;
                                if (x == null || y == null) return null;
                                return (
                                    <text x={x} y={y - 8} textAnchor="middle" fontSize={14} fill="#555">
                                        {String(value) + ((temperatureType == 'Celsius') ? '°C' : '°F')}
                                    </text>
                                );
                            }} />
                    </Line>
                </ComposedChart>
            </ResponsiveContainer>
            <TemperatureButton value={temperatureType} onClick={() => setTemperatureType(temperatureType === 'Celsius' ? 'Fahrenheit' : 'Celsius')} />
        </div>
    );
}

function LegendContent(props: unknown) {
    // TS-safe read of payload
    const payload = (props as unknown as { payload?: any[] }).payload ?? [];
    const items = payload.filter((p) => p?.value !== "range" && p?.value !== "min");
    const order: Record<string, number> = { Min: 0, Max: 1, "Temp @ 2pm": 2 };
    items.sort((a, b) => (order[String(a.value)] ?? 10) - (order[String(b.value)] ?? 10));
    if (!items.length) {
        return null;
    }

    return (
        <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <ul
                style={{
                    display: "inline-flex",
                    gap: 12,
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                }}
            >
                {items.map((it, i) => (
                    <li key={`${String(it.value)}-${i}`} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                        style={{
                            width: 10, height: 10, borderRadius: 2,
                            background: String(it.color ?? "#999"), display: "inline-block",
                        }}
                    />
                        <span>{String(it.value)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function TooltipContent(props: TooltipProps<ValueType, NameType>) {
    // Access fields defensively to satisfy different Recharts typings
    const active = (props as any).active as boolean | undefined;
    if (!active) {
        return null;
    }

    const label = (props as any).label as unknown; // could be string/number/date depending on XAxis
    const rawPayload = (props as any).payload as Array<any> | undefined;

    const items =
        rawPayload?.filter(Boolean).filter((p) => p?.name !== "range" && p?.name !== "min") ?? [];
    const order: Record<string, number> = { Min: 0, Max: 1, "Temp @ 2pm": 2 };
    items.sort((a, b) => (order[String(a.value)] ?? 10) - (order[String(b.value)] ?? 10));
    if (items.length === 0) {
        return null;
    }

    return (
        <div style={{ background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: 8 }}>
            {label != null && (
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{String(label)}</div>
            )}
            {items.map((item, i) => (
                <div key={`${item.dataKey ?? i}`} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{
                            width: 10, height: 10, borderRadius: 2,
                            background: String(item.color ?? "#999"), display: "inline-block"
                        }}
                    />
                    <span>{String(item.name ?? item.dataKey)}:</span>
                    <span>{String(item.value) + "°F"}</span>
                </div>
            ))}
        </div>
    );
}