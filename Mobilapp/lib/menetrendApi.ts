import { postJSON } from "./api";
import type { Station, Journey } from "../models/types";

export async function searchStation(query: string): Promise<Station[]> {
    const data: any = await postJSON("/searchStation", { query });

    // ✅ próbáljuk meg több lehetséges helyről kibontani a listát
    const list: any[] =
        data?.results ??
        data?.result?.data ??
        data?.result?.stations ??
        data?.result ??
        data?.results?.data ??
        data?.results?.stations ??
        data?.data ??
        data?.stations ??
        [];

    list.sort((a, b) => {
        const aIsSite = a?.type === "SITE_TYPE" ? 0 : 1;
        const bIsSite = b?.type === "SITE_TYPE" ? 0 : 1;
        return aIsSite - bIsSite;
    });

    // DEBUG (ha még mindig nem jó, ezt nézd a konzolban)
    console.log("searchStation raw:", data);
    console.log("searchStation list:", list);

    return (Array.isArray(list) ? list : Object.values(list))
        .map((x: any) => ({
            lsname: x.lsname ?? x.name ?? x.ls_name ?? x.title ?? "",
            settlement_id: Number(x.settlement_id ?? x.settlementId ?? x.settle_id ?? 0),
            ls_id: Number(x.ls_id ?? x.lsId ?? x.id ?? 0),
            site_code: Number(x.site_code ?? x.siteCode ?? 0),
        }))
}

export async function searchRoutesCustom(
    from: Station,
    to: Station,
    date: string,
    hour: number,
    minute: number
): Promise<Journey[]> {
    const body = {
        from: {
            name: from.lsname,
            settlementId: from.settlement_id,
            ls_id: from.ls_id,
            siteCode: from.site_code ?? 0,
        },
        to: {
            name: to.lsname,
            settlementId: to.settlement_id,
            ls_id: to.ls_id,
            siteCode: to.site_code ?? 0,
        },
        date,
        hour,
        minute,
    };

    const data: any = await postJSON("/searchRoutesCustom", body);

    const journeys: any[] =
        Array.isArray(data)
            ? data
            : data?.results?.talalatok
                ? Object.values(data.results.talalatok)
                : data?.results
                    ? Object.values(data.results)
                    : [];

    // ghost szűrés
    return journeys.filter((j: any) => {
        const first = j?.nativeData?.[0];
        const last = j?.nativeData?.[j?.nativeData?.length - 1];
        return first?.DepartureTime != null && last?.ArrivalTime != null;
    });
}

export type RunDescriptionStop = {
  megallo: string;
  erkezik?: string;
  indul?: string;
  bay?: string;
  felszallas_info?: string;

  // néha ezek is jönnek (késéses nézethez)
  varhato_erkezik?: string;
  varhato_indul?: string;
};

export async function runDescription(params: {
  runId: number;
  slsId: number;
  elsId: number;
  date: string; // "YYYY-MM-DD"
}): Promise<RunDescriptionStop[]> {
  const { runId, slsId, elsId, date } = params;

  // minimál sanity check (üres dátum tipikusan 400/500-at okozott nálad)
  if (!runId || !slsId || !elsId || !date) return [];

  // backend: camelCase-t és snake_case-t is elfogad, de maradjunk camelCase-nél
  const data: any = await postJSON("/runDescription", { runId, slsId, elsId, date });

  // a backend nálad már csak a kifejtes_sor objektumot adja vissza:
  // { "1": {...}, "2": {...}, ... }
  const stops = Object.values(data ?? {}) as any[];

  return stops.map((s: any) => ({
    megallo: s.megallo ?? "",
    erkezik: s.erkezik ?? "",
    indul: s.indul ?? "",
    bay: s.bay ?? "",
    felszallas_info: s.felszallas_info ?? "",

    varhato_erkezik: s.varhato_erkezik ?? s.arrival_estimated ?? "",
    varhato_indul: s.varhato_indul ?? s.departure_estimated ?? "",
  }));
}