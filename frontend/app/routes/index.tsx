import type {Route} from "./+types/index";
import PoolTemperature from "~/components/PoolTemperature";
import {POOL_TEMPERATURE_DATA} from "~/constants/path"
import {convertToGraphItems} from "~/utils/graph-utils";
import type {TemperatureAndTimeData, TemperatureGraphItem} from "~/types/temperature-types";

export async function clientLoader() {
    const res = await fetch(POOL_TEMPERATURE_DATA);
    const poolTemperatures = await res.json();
    const formatted: TemperatureAndTimeData[] = poolTemperatures.map((item: any) => {
        return {id: item.id, temperature: item.temperature, reading_time: item.reading_time}
    })
    const rows: TemperatureGraphItem[] = convertToGraphItems(formatted)

    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    rows.forEach((item) => {
        if (item.min < min) min = item.min;
        if (item.max > max) max = item.max;
    })

    return {rows, min, max};
}


export default function IndexPage({loaderData}: Route.ComponentProps) {
  return <PoolTemperature data={loaderData.rows} min={loaderData.min} max={loaderData.max}/>;
}
