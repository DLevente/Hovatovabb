import { Component, OnInit, Input } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { forkJoin, map } from 'rxjs';
import { UserService } from '../../services/user.service';
import { PlanService } from '../../services/plan.service';

@Component({
  selector: 'app-search',
  standalone: false,
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  @Input() kedvId: number = 3;

  from: any = null;
  to: any = null;
  journeys: any[] = [];
  calcDelays = false;
  loading = false;
  searched = false;
  error = '';
  allowTransfers = true;
  selectedDate: string = '';
  selectedTime: string = '';
  dateValue: string = '';
  timeValue: string = '';

  defaultDate = new Date().toISOString().split("T")[0];
  delayLoading = false;

  ngOnInit() {
    const now = new Date();

    // YYYY-MM-DD
    this.dateValue = now.toISOString().slice(0, 10);

    // HH:MM
    this.timeValue = now.toTimeString().slice(0, 5);
  }


  constructor(
    private search: SearchService,
    private userService: UserService,
    private planService: PlanService
  ) { }

  onSelectFrom(s: any) { this.from = s; }
  onSelectTo(s: any) { this.to = s; }

  onSwap() {
    const t = this.from;
    this.from = this.to;
    this.to = t;
    document.getElementById('search-from').querySelector("input").value = this.from?.lsname ?? '';
    document.getElementById('search-to').querySelector("input").value = this.to?.lsname ?? '';
  }

  searchDone = false;
  onSearch() {
    this.error = '';
    this.journeys = [];
    this.searched = false;

    if (!this.from || !this.to) {
      this.error = 'Válassz indulási és érkezési állomást!';
      return;
    }

    this.loading = true;
    this.delayLoading = false;

    const dateToSend = this.selectedDate || new Date().toISOString().split("T")[0];

    const now = new Date();
    const fallbackTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const [hourString, minuteString] = (this.selectedTime || fallbackTime).split(":");
    const hourToSend = parseInt(hourString, 10);
    const minuteToSend = parseInt(minuteString, 10);

    this.search.searchRoutesCustom(this.from, this.to, dateToSend, hourToSend, minuteToSend)
      .subscribe({
        next: res => {
          let arr: any[] = res || [];

          // ghost szűrés (a tiéd)
          arr = arr.filter(j => {
            const seg = j.nativeData?.[0];
            const last = j.nativeData?.[j.nativeData.length - 1];
            if (!seg || !last) return false;
            if (seg.DepartureTime == null || last.ArrivalTime == null) return false;
            if (isNaN(Number(seg.DepartureTime)) || isNaN(Number(last.ArrivalTime))) return false;
            return true;
          });

          // átszállás szűrés
          if (!this.allowTransfers) {
            arr = arr.filter(j => (j.nativeData?.length ?? 1) === 1);
          }

          arr.forEach(j => {
            const first = j.nativeData?.[0];
            const last = j.nativeData?.[j.nativeData.length - 1];

            // nativeData idő percben -> HH:mm
            j.realDeparture = this.formatMinutes(first?.DepartureTime);
            j.realArrival = this.formatMinutes(last?.ArrivalTime);

            // késés nélküli alap
            j.arrivalDelayMin = 0;
            j.arrivalDisplay = j.realArrival;
          });


          // ha NINCS késésszámítás → kész is
          if (!this.calcDelays) {
            this.journeys = arr;      // sima lista
            this.loading = false;
            this.searched = true;
            this.delayLoading = false;
            return;
          }

          // ✅ gyors előnézet azonnal
          this.journeys = arr;
          this.searched = true;

          // innentől "késések számítása..."
          this.loading = false;
          this.delayLoading = true;

          const date = dateToSend;

          // 1) runDescription alapú “realDeparture/realArrival”
          forkJoin(
            arr.map(journey =>
              forkJoin(
                journey.nativeData.map((seg: any) =>
                  this.search.getDelayInfo(seg.RunId, seg.DepartureStation, seg.ArrivalStation, date)
                )
              ).pipe(
                map((delayList: any[]) => {
                  journey.delayInfo = delayList;
                  return journey;
                })
              )
            )
          ).subscribe({
            next: (final: any[]) => {
              // runDescription -> realDeparture/realArrival
              final.forEach(journey => {
                const firstSegDelay = journey.delayInfo[0];
                const lastSegDelay = journey.delayInfo[journey.delayInfo.length - 1];

                const fromName = journey.indulasi_hely || firstSegDelay.stops?.[0]?.megallo;
                const toName = journey.erkezesi_hely || lastSegDelay.stops?.[lastSegDelay.stops.length - 1]?.megallo;

                const depPick = this.pickDepartureFromSegment(firstSegDelay, fromName);
                const arrPick = this.pickArrivalFromSegment(lastSegDelay, toName);

                journey.realDeparture = depPick.time;
                journey.realArrival = arrPick.time;
                journey.departureDelayed = depPick.delayed;
                journey.arrivalDelayed = arrPick.delayed;

                // defaultok (runsDelay-hez)
                journey.arrivalDelayMin = 0;
                journey.arrivalDisplay = journey.realArrival;
              });

              // 2) getRunsDelay -> érkezéshez hozzáadás
              const runIds = Array.from(new Set(
                final.map(j => Number(j.nativeData?.[j.nativeData.length - 1]?.RunId)).filter(Boolean)
              ));

              this.search.runsDelay(runIds).subscribe({
                next: (rows: any[]) => {
                  const delayMap = new Map<number, string>();
                  (rows || []).forEach(r => delayMap.set(Number(r.run_id), String(r.delay || '00:00:00')));

                  final.forEach(journey => {
                    const lastSeg = journey.nativeData?.[journey.nativeData.length - 1];
                    const runId = Number(lastSeg?.RunId);

                    const delayStr = delayMap.get(runId) ?? '00:00:00';
                    const delayMin = this.delayToMinutes(delayStr);

                    if (delayMin > 0 && journey.realArrival) {
                      journey.arrivalDelayMin = delayMin;
                      journey.arrivalDisplay = this.addMinutesToHHmm(journey.realArrival, delayMin);
                    } else {
                      journey.arrivalDelayMin = 0;
                      journey.arrivalDisplay = journey.realArrival;
                    }
                  });

                  // rendezés
                  final.sort((a, b) =>
                    this.timeToMinutes(a.realDeparture) - this.timeToMinutes(b.realDeparture)
                  );

                  this.journeys = final;
                  this.searched = true;
                  this.delayLoading = false;
                },
                error: _ => {
                  // delay nélkül is frissítjük a finalt
                  final.sort((a, b) =>
                    this.timeToMinutes(a.realDeparture) - this.timeToMinutes(b.realDeparture)
                  );
                  this.journeys = final;
                  this.searched = true;
                  this.delayLoading = false;
                }
              });
            },
            error: err => {
              this.error = err?.message ?? 'Hiba történt';
              this.delayLoading = false;
            }
          });
        },

        error: err => {
          this.loading = false;
          this.delayLoading = false;
          this.error = err?.message ?? 'Hiba történt';
        }
      });
  }


  onDateChange(event: any) {
    this.selectedDate = event.target.value;
    this.selectedTime = "00:00";
  }

  onTimeChange(event: any) {
    this.selectedTime = event.target.value;
  }

  selectedJourneyInfo: any = null;

  openJourneyInfo(j: any) {
    this.selectedJourneyInfo = j;
  }

  closeJourneyInfo() {
    this.selectedJourneyInfo = null;
  }

  timeToMinutes(t: string): number {
    if (!t) return 99999;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  private cleanTime(v: any): string {
    if (!v) return "";
    const s = String(v).trim().toLowerCase();
    if (s === "n.a" || s === "n.a." || s === "n.a ") return "";
    return String(v).trim();
  }

  private pickDepartureFromSegment(segmentDelay: any, stopName: string): { time: string; delayed: boolean } {
    const stops = segmentDelay.stops || [];
    const found = stops.find((s: any) => s.megallo === stopName);

    if (found) {
      const vd = this.cleanTime(found.varhato_indul);
      const sd = this.cleanTime(found.indul);

      if (vd) return { time: vd, delayed: true };
      if (sd) return { time: sd, delayed: false };
    }

    // ha nem találtuk a megállót, essünk vissza a szakasz aggregált adataira
    const vd = this.cleanTime(segmentDelay.expectedDeparture);
    const sd = this.cleanTime(segmentDelay.scheduledDeparture);

    if (vd) return { time: vd, delayed: segmentDelay.hasDepartureDelay };
    return { time: sd, delayed: false };
  }

  private pickArrivalFromSegment(segmentDelay: any, stopName: string): { time: string; delayed: boolean } {
    const stops = segmentDelay.stops || [];
    const found = stops.find((s: any) => s.megallo === stopName);

    if (found) {
      const va = this.cleanTime(found.varhato_erkezik);
      const sa = this.cleanTime(found.erkezik);

      if (va) return { time: va, delayed: true };
      if (sa) return { time: sa, delayed: false };
    }

    const va = this.cleanTime(segmentDelay.expectedArrival);
    const sa = this.cleanTime(segmentDelay.scheduledArrival);

    if (va) return { time: va, delayed: segmentDelay.hasArrivalDelay };
    return { time: sa, delayed: false };
  }

  delayToMinutes(delay: string): number {
    if (!delay) return 0;

    const neg = delay.startsWith('-');
    const [h, m, s] = delay.replace('-', '').split(':').map(Number);
    const min = h * 60 + m + Math.round((s || 0) / 60);

    return neg ? -min : min;
  }

  addMinutesToHHmm(time: string, add: number): string {
    const [h, m] = time.split(':').map(Number);
    let total = h * 60 + m + add;

    total = ((total % 1440) + 1440) % 1440;

    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private formatMinutes(t: any): string {
    const n = Number(t);
    if (isNaN(n)) return '';
    const h = Math.floor(n / 60) % 24;
    const m = n % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}