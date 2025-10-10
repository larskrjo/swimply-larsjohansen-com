import type {TemperatureAndTimeData, TemperatureGraphItem} from "~/types/temperature-types";

export function convertToGraphItems(data: TemperatureAndTimeData[]): TemperatureGraphItem[] {

    let dayMapping: Map<string, Set<TemperatureAndTimeData>> = new Map();

    data.forEach((item: TemperatureAndTimeData) => {
        const date = new Date(item.reading_time).toLocaleDateString("en-CA");
        if (dayMapping.has(date)) {
            dayMapping.get(date)?.add(item);
        } else {
            dayMapping.set(date, new Set([item]));
        }
    });

    let dayItems: TemperatureGraphItem[] = [];
    dayMapping.forEach((value, key) => {
        let min = Number.MAX_SAFE_INTEGER;
        let max = Number.MIN_SAFE_INTEGER;
        value.forEach((item) => {
            min = Math.min(min, item.temperature);
            max = Math.max(max, item.temperature);
        });
        let twoOClockValue = 0.0;
        let measurements = 0;
        value.forEach((item) => {
            const hours = new Date(item.reading_time).getHours();
            if (hours == 13 || 14) {
                twoOClockValue += item.temperature;
                measurements++;
            }
        });
        if (measurements > 0) {
            twoOClockValue = twoOClockValue / measurements;
        } else {
            twoOClockValue = (max + min) / 2
        }
        let minF = Number(celsiusToFahrenheit(min).toFixed(1));
        let maxF = Number(celsiusToFahrenheit(max).toFixed(1));
        let valueF = Number(celsiusToFahrenheit(twoOClockValue).toFixed(1));

        const keyFormatted = new Intl.DateTimeFormat("en-CA", {
            month: "short",
            day: "numeric",
            timeZone: "UTC",
        }).format(new Date(key));
        dayItems.push({
            x: keyFormatted,
            min: minF,
            max: maxF,
            value: valueF
        })
    })

    return dayItems;
}

function celsiusToFahrenheit(celsius: number): number {
    return celsius * 9 / 5 + 32;
}