import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { PlanService } from '../../../services/plan.service';
import { AlertService } from '../../../services/alert.service';
import { UserService } from '../../../services/user.service';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-plan-details',
  standalone: false,
  templateUrl: './plan-details.component.html',
  styleUrls: ['./plan-details.component.css']
})
export class PlanDetailsComponent implements OnChanges {
  @Input() plan: any = null;
  @Output() back = new EventEmitter<void>();

  loading = false;
  error = '';

  routes: any[] = [];
  runMetaMap: Record<number, any> = {};

  kedvId: number = 3;

  sumFare = 0;
  sumDuration = 0;

  confirmDeleteOpen = false;
  routeToDelete: any = null;

  fareNotAvailable = false;

  showInfoModal = false;
  infoJourney: any = null;
  infoDate = '';

  constructor(
    private planService: PlanService,
    private alertService: AlertService,
    private userService: UserService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plan'] && this.plan?.id) {
      this.load();
    }
  }

  ngOnInit(): void {
    this.userService.user$.subscribe((res: any) => {
      const u = res?.user ?? res;
      this.kedvId = u?.kedv_id ?? 3;
    });
  }

  load() {
    this.loading = true;
    this.error = '';
    this.routes = [];
    this.runMetaMap = {};
    this.sumFare = 0;
    this.sumDuration = 0;

    this.planService.getPlanRoutes(this.plan.id).subscribe({
      next: (rows: any[]) => {
        this.routes = Array.isArray(rows) ? rows : [];
        const currFare = this.routes.reduce((acc, r) => acc + Number(r.jegyar ?? 0), 0);
        if (currFare > 0) {
          if (this.kedvId === 1) {
            this.sumFare = 0;
          }
          else if (this.kedvId === 2) {
            this.sumFare = Math.round(currFare * 0.5);
          }
          else {
            this.sumFare = currFare;
          }
        }

        this.sumDuration += this.routes.reduce((acc, r) => acc + this.timeToMinutes(r.ido), 0);

        const runIds = Array.from(
          new Set(
            this.routes
              .map(r => Number(r.run_id))
              .filter(x => !!x && !isNaN(x))
          )
        );

        if (runIds.length === 0) {
          this.loading = false;
          return;
        }

        this.planService.runsDelay(runIds)
          .pipe(catchError(() => of([])))
          .subscribe((metaList: any[]) => {
            const map: Record<number, any> = {};
            (metaList || []).forEach(m => {
              map[Number(m.run_id)] = m;
            });
            this.runMetaMap = map;
            this.loading = false;
          });
      },
      error: (e) => {
        console.error(e);
        this.error = 'Nem sikerült betölteni a terv részleteit.';
        this.loading = false;
      }
    });
  }

  cardBorder(route: any): string {
    const s = Number(route?.elerte ?? 2);

    if (s === 1) return '1px solid #16a34a';
    if (s === 0) return '1px solid #ef4444';
    return '1px solid #334155';
  }

  setStatus(route: any, status: number) {
    route.elerte = status;

    this.planService.updateRouteStatus(route.id, status).subscribe({
      next: () => this.load(),
      error: (e) => console.error(e)
    });
  }

  statusBtnDisplay(route: any): string {
    const s = Number(route?.elerte ?? 2);
    if (s === 1) return 'd-none';
    return 'd-block';
  }

  cardBg(route: any): string {
    const s = Number(route?.elerte ?? 2);

    if (s === 1) {
      return 'rgba(16, 185, 129, 0.08)';
    }
    return '#0f172a';
  }

  // --- META HELPERS ---
  private meta(route: any): any {
    const id = Number(route?.run_id);
    return this.runMetaMap?.[id] ?? null;
  }

  displayLine(route: any): string {
    return String(route?.code ?? '').trim() || '—';
  }

  displayOwner(route: any): string {
    return String(route?.owner ?? '').trim();
  }

  // --- ICONS ---
  getVehicleIcon(route: any): string {
    const id = Number(route?.jarmu_id ?? 0);
    if (id === 1) return 'icons/bus.svg';
    if (id === 2) return 'icons/train.svg';
    if (id === 4) return 'icons/tram.svg';
    if (id === 5) return 'icons/metro.svg';
    return 'icons/bus.svg';
  }

  // --- STATUS UI ---
  isDone(route: any): boolean {
    return Number(route?.elerte ?? 2) === 1;
  }

  isMissed(route: any): boolean {
    return Number(route?.elerte ?? 2) === 0;
  }

  // --- ACTIONS ---
  askRemove(route: any) {
    this.routeToDelete = route;
    this.confirmDeleteOpen = true;
  }

  cancelDelete() {
    this.confirmDeleteOpen = false;
    this.routeToDelete = null;
  }

  confirmDelete() {
    if (!this.routeToDelete) return;

    this.planService.deletePlanRoute(this.routeToDelete.id).subscribe({
      next: () => {
        this.load();
        this.alertService.show('Járat sikeresen törölve a tervből.');
      },
      error: (e) => console.error(e)
    });

    this.cancelDelete();
  }

  // --- FORMATTING ---
  formatHM(value: any): string {
    if (!value) return '—';

    if (typeof value === 'string') {
      const m = value.match(/(\d{2}):(\d{2})/);
      let ora;
      let perc;
      if (m) {
        ora = parseInt(m[1]) + 1;
        perc = m[2];
      }
      if (ora && ora < 10) {
        ora = `0${ora}`;
      }
      return `${ora}:${perc}`;
    }

    return '—';
  }

  private minutesBetween(start: any, end: any): number | null {
    const toDate = (v: any): Date | null => {
      if (!v) return null;
      if (v instanceof Date) return v;

      if (typeof v === 'string') {
        const fixed = v.includes('T') ? v : v.replace(' ', 'T');
        const d = new Date(fixed);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };

    const s = toDate(start);
    const e = toDate(end);
    if (!s || !e) return null;

    const diff = Math.round((e.getTime() - s.getTime()) / 60000);
    return isNaN(diff) ? null : diff;
  }

  durationText(route: any): string {
    if (route?.ido) {
      const n = Number(route.ido);
      if (!isNaN(n)) {
        const h = Math.floor(n / 60);
        const m = n % 60;
        return `${h}ó ${m}p`;
      }
      return String(route.ido.slice(0, -3));
    }

    // különben számoljuk ind/érk alapján
    const mins = this.minutesBetween(route?.ind_ido, route?.erk_ido);
    if (mins === null) return '—';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}ó ${m}p`;
  }

  fareText(route: any): string {
    let fare = Number(route?.jegyar ?? 0);
    if (route.owner === "VOLÁN" || route.owner === "MÁV") {
      if (this.kedvId === 1) {
        fare = 0;
      }
      else if (this.kedvId === 2) {
        fare = Math.round(fare * 0.5);
      }
    }
    if (!fare || isNaN(fare) || fare < 0) {
      this.fareNotAvailable = true;
      return 'Jegyár nem elérhető';
    }
    if (route.owner === "BKK" && !route.code.startsWith('H')) {
      return `500 Ft`;
    }
    return `${fare} Ft`;
  }

  ownerColor(route: any): string {
    const owner = this.displayOwner(route);

    if (!owner) return '#1e293b';

    if (owner.startsWith('BKK')) return '#4c0e5f';
    if (owner.startsWith('VOLÁN')) return '#995400';
    if (owner.startsWith('MÁV')) return '#1e40af';

    return '#00520a';
  }

  displaySumFare(): string {
    if (this.sumFare == 0 || this.fareNotAvailable) {
      return '- Ft';
    }
    return `${this.sumFare} Ft`;
  }

  displaySumDuration(): string {
    if (this.sumDuration == 0) {
      return '-';
    }

    const h = Math.floor(this.sumDuration / 60);
    const m = this.sumDuration % 60;
    if (h < 10 && m < 10) {
      return `0${h}:0${m}`;
    }
    else if (h < 10) {
      return `0${h}:${m}`;
    }
    else if (m < 10) {
      return `${h}:0${m}`;
    }
    else {
      return `${h}:${m}`;
    }
  }

  timeToMinutes(t: string): number {
    if (!t) return 0;

    const [h, m, s] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private abbreviateStopName(name: string): string {
    let s = (name ?? '').trim();
    if (!s) return '';

    s = s.replace(/\s+/g, ' ');

    if (s === "Autóbusz-állomás") {
      return "Autóbusz-áll.";
    }

    s = s.replace(/autóbusz-állomás/gi, 'autóbusz-áll.');
    s = s.replace(/vasútállomás/gi, 'vá.');
    s = s.replace(/pályaudvar/gi, 'pu.');
    s = s.replace(/váróterem/gi, 'vt.');
    s = s.replace(/állomás/gi, 'áll.');

    return s;
  }

  private splitStation(name: string): { city: string; stop: string } {
    const s = this.abbreviateStopName(name);

    const commaIdx = s.indexOf(',');
    if (commaIdx !== -1) {
      const city = s.slice(0, commaIdx).trim();
      const stop = s.slice(commaIdx + 1).trim();
      return { city: city || s, stop: stop || '' };
    }

    const m = s.match(/^(.*)\s+(vá\.|pu\.|vt\.|áll\.)$/i);
    if (m) {
      return { city: (m[1] ?? s).trim(), stop: (m[2] ?? '').trim() };
    }

    return { city: s, stop: '' };
  }

  formatStationHtml(name: string): string {
    const { city, stop } = this.splitStation(name);
    if (!stop) return `<strong>${this.escapeHtml(city)}</strong>`;
    return `<strong>${this.escapeHtml(city)}</strong><br>${this.escapeHtml(stop)}`;
  }

  private escapeHtml(s: string): string {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  openInfo(route: any) {
    this.infoJourney = {
      nativeData: [
        {
          RunId: Number(route.run_id),
          DepartureStation: Number(route.sls_id),
          ArrivalStation: Number(route.els_id),
          OwnerName: route.owner,
          JourneyName: route.code,
          LocalDomainCode: route.code,
          FromBay: route.bay,

          Mode:
            Number(route.jarmu_id) === 1 ? 'bus' :
              Number(route.jarmu_id) === 2 ? 'train' :
                Number(route.jarmu_id) === 4 ? 'tram' :
                  Number(route.jarmu_id) === 5 ? 'metro' : 'train',
        }
      ]
    };

    const dt = String(route.ind_ido ?? '');
    const m = dt.match(/^(\d{4}-\d{2}-\d{2})/);
    this.infoDate = m ? m[1] : new Date().toISOString().slice(0, 10);

    this.showInfoModal = true;
  }

  closeInfo() {
    this.showInfoModal = false;
    this.infoJourney = null;
    this.infoDate = '';
  }

  onBack() { this.back.emit(); }
}