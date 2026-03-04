import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SearchService {

  baseUrl = 'https://api.hova-tovabb.hu';

  constructor(private http: HttpClient) { }

  searchStation(query: string): Observable<any[]> {
    return this.http.post<any>(`${this.baseUrl}/searchStation`, { query })
      .pipe(map(res => res?.results ?? []));
  }

  // 🔵 EREDETI
  searchRoutes(from: any, to: any): Observable<any[]> {
    const payload = {
      from: {
        name: from.lsname,
        settlementId: from.settlement_id,
        ls_id: from.ls_id,
        siteCode: from.site_code,
      },
      to: {
        name: to.lsname,
        settlementId: to.settlement_id,
        ls_id: to.ls_id,
        siteCode: to.site_code,
      }
    };

    return this.http.post<any>(`${this.baseUrl}/searchRoutes`, payload)
      .pipe(
        map(res => {
          if (!res?.results?.talalatok) return [];
          return Object.values(res.results.talalatok);
        })
      );
  }

  // 🔵 ÚJ: dátum + óra + perc
  searchRoutesCustom(from: any, to: any, date: string, hour: number, minute: number): Observable<any[]> {
    const payload = {
      from: {
        name: from.lsname,
        settlementId: from.settlement_id,
        ls_id: from.ls_id,
        siteCode: from.site_code,
      },
      to: {
        name: to.lsname,
        settlementId: to.settlement_id,
        ls_id: to.ls_id,
        siteCode: to.site_code,
      },
      date,
      hour,
      minute
    };

    return this.http.post<any>(`${this.baseUrl}/searchRoutesCustom`, payload)
      .pipe(
        map(res => {
          if (!res?.results?.talalatok) return [];
          return Object.values(res.results.talalatok);
        })
      );
  }

  // Járat leírás
  getRunDescription(runId: string | number, slsId: number, elsId: number, date: string) {
    return this.http.post<any>(`${this.baseUrl}/runDescription`, {
      runId,
      slsId,
      elsId,
      date
    });
  }

  // Késések kezelése
  private delayCache = new Map<string, any>();

  getDelayInfo(runId: string | number, depSt: number, arrSt: number, date: string) {
    const key = `${runId}_${depSt}_${arrSt}_${date}`;

    if (this.delayCache.has(key)) {
      return of(this.delayCache.get(key));
    }

    return this.getRunDescription(runId, depSt, arrSt, date).pipe(
      map((res: any) => {
        // FONTOS: a backend nálad már csak kifejtes_sor-t ad vissza, NEM teljes results-ot
        // tehát res = { "1": { ... }, "2": { ... } ... }

        const stops: any[] = Object.values(res || {});
        if (!stops.length) {
          const empty = {};
          this.delayCache.set(key, empty);
          return empty;
        }

        const first: any = stops[0];
        const last: any = stops[stops.length - 1];

        const clean = (v: any) => {
          if (!v) return "";
          if (v === "n.a.") return "";
          if (v === "n.a") return "";
          if (v === "n.a ") return "";
          return v;
        };

        const delayData = {
          stops,

          expectedDeparture: clean(first.varhato_indul),
          scheduledDeparture: clean(first.indul) || clean(first.erkezik),  // <-- ÚJ fallback

          expectedArrival: clean(last.varhato_erkezik),
          scheduledArrival: clean(last.erkezik) || clean(last.indul),      // <-- ÚJ fallback

          hasDepartureDelay: clean(first.varhato_indul) !== "",
          hasArrivalDelay: clean(last.varhato_erkezik) !== ""
        };

        this.delayCache.set(key, delayData);
        return delayData;
      })
    );
  }
  
  runsDelay(runIds: number[]) {
    return this.http.post<any[]>(`${this.baseUrl}/runsDelay`, { runs: runIds });
  }
}
