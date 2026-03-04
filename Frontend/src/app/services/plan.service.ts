import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, BehaviorSubject, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PlanService {
  // FONTOS: nálad nincs /api prefix a domainben
  baseUrl = 'https://api.hova-tovabb.hu';

  constructor(private http: HttpClient) { }

  private plansSubject = new BehaviorSubject<any[]>([]);
  plans$ = this.plansSubject.asObservable();

  // --- PLANS ---
  reloadPlans(username: string) {
    return this.getPlans(username).pipe(
      tap((plans) => this.plansSubject.next(plans || []))
    );
  }

  getPlans(username: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/plans/${username}`);
  }

  addPlan(username: string, nev: string) {
    return this.http.post<any>(`${this.baseUrl}/addPlan`, {
      felhasznalonev: username,
      nev
    });
  }

  deletePlan(tervId: number) {
    return this.http.delete<any>(`${this.baseUrl}/planDelete/${tervId}`);
  }

  // --- PLAN ROUTES ---

  getPlanRoutes(tervId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/planRoutes/${tervId}`);
  }

  deletePlanRoute(jaratId: number) {
    return this.http.delete<any>(`${this.baseUrl}/planRouteDelete/${jaratId}`);
  }

  // --- MENETREND META / DELAY ---

  runsDelay(runIds: number[]) {
    return this.http.post<any[]>(`${this.baseUrl}/runsDelay`, { runs: runIds });
  }

  // --- STATUS ---

  updateRouteStatus(jaratId: number, elerte: number) {
    return this.http.put<any>(`${this.baseUrl}/routeStatus/${jaratId}`, { elerte });
  }

  // --- ADD JOURNEY TO PLAN ---

  addJourneyToPlan(journey: any, tervId: number, sorrend: number, date: string): Observable<any> {
    const first = journey.nativeData?.[0];
    const last = journey.nativeData?.[journey.nativeData.length - 1];

    const ind = this.toDateTime(date, journey.realDeparture ?? '');
    const erk = this.toDateTime(date, journey.realArrival ?? '');

    const mode = first?.TransportMode ?? first?.Mode ?? '';
    const jarmu_id = this.resolveJarmuIdFromMode(mode);

    console.log('LocalDomainCode:', first?.LocalDomainCode);

    const payloadRoute = {
      ind_allomas: first?.DepStationName ?? journey.indulasi_hely ?? '',
      erk_allomas: last?.ArrStationName ?? journey.erkezesi_hely ?? '',
      ind_ido: ind,
      erk_ido: erk,
      jegyar: Number(first?.Fare ?? 0),
      jarmu_id,
      ido: journey.osszido ?? '',
      km: Number(journey.km ?? 0),
      run_id: Number(first?.RunId ?? 0),
      sls_id: Number(first?.DepartureStation ?? 0),
      els_id: Number(first?.ArrivalStation ?? 0),
      bay: String(first?.FromBay ?? '').trim(),
      owner: String(first?.OwnerName ?? '').trim(),
      code: String(first?.ShortName).trim(),
      elerte: 2
    };

    return this.http.post<any>(`${this.baseUrl}/addRoute`, payloadRoute).pipe(
      switchMap((r) => this.http.post(`${this.baseUrl}/addPlanRoute`, {
        jarat_id: r.jaratId,
        terv_id: tervId,
        sorrend
      }))
    );
  }

  private resolveJarmuIdFromMode(mode: any): number {
    const m = String(mode ?? '').toLowerCase();
    if (m.includes('bus') || m.includes('volan') || m.includes('agglo')) return 1; // busz
    if (m.includes('tram')) return 4; // villamos
    if (m.includes('metro')) return 5; // metró
    return 2; // vonat default
  }

  // --- HELPERS ---

  private toDateTime(date: string, hm: string): string {
    if (!date || !hm) return '';
    const [h, m] = String(hm).split(':');
    if (h == null || m == null) return '';
    return `${date} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  }

  private minutesToHM(v: any): string {
    const n = Number(v);
    if (!Number.isFinite(n)) return '';
    const h = Math.floor(n / 60) % 24;
    const m = n % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private resolveJarmuId(journey: any): number {
    const segs = journey?.nativeData ?? [];

    const modes = segs.map((s: any) =>
      String(s?.TransportMode ?? '').toLowerCase()
    );

    // busz
    if (
      modes.some((m: string) => m.includes('bus'))
    ) return 1;

    // vonat
    if (
      modes.some((m: string) => m.includes('train') || m.includes('localtrain') || m.includes('rail'))
    ) return 2;

    // villamos
    if (
      modes.some((m: string) => m.includes('villamos'))
    ) return 4;

    // metró
    if (
      modes.some((m: string) => m.includes('metro'))
    ) return 5;

    // fallback: olyan ID legyen, ami BIZTOSAN létezik a jarmu táblában
    return 1;
  }
}