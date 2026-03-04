import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SearchService } from '../../../services/search.service';

type SegmentStops = {
  segment: any;
  stops: any[];
};

@Component({
  selector: 'app-journey-info',
  standalone: false,
  templateUrl: './journey-info.component.html',
  styleUrls: ['./journey-info.component.css']
})
export class JourneyInfoComponent implements OnInit {
  @Input() journey: any = null; // teljes journey (több szakasz)
  @Input() date: string = "";   // selectedDate (YYYY-MM-DD)
  @Output() close = new EventEmitter<void>();

  loading = false;
  error = '';

  // minden szakaszhoz megállólista
  segments: SegmentStops[] = [];

  // kiválasztott szakasz
  selectedIndex = 0;

  constructor(private search: SearchService) {}

  ngOnInit() {
    if (!this.journey) return;
    this.loadAllSegments();
  }

  async loadAllSegments() {
    this.loading = true;
    this.error = '';
    this.segments = [];
    this.selectedIndex = 0;

    const native = Array.isArray(this.journey?.nativeData) ? this.journey.nativeData : [];

    for (const seg of native) {
      try {
        const res = await firstValueFrom(
          this.search.getRunDescription(seg.RunId, seg.DepartureStation, seg.ArrivalStation, this.date)
        );

        // ✅ nincs normalizálás: nyersen betesszük
        const stops = Object.values(res || {}) as any[];

        this.segments.push({
          segment: seg,
          stops
        });
      } catch (err) {
        this.error = "Nem sikerült betölteni a megállókat.";
      }
    }

    this.loading = false;
  }

  selectSegment(i: number) {
    this.selectedIndex = i;
  }

  get selectedSeg(): SegmentStops | null {
    return this.segments?.[this.selectedIndex] ?? null;
  }

  segmentLine(seg: any): string {
    // cél: DomainCode / LocalDomainCode / JourneyName / LongName / Number sorrendben
    return (
      seg?.DomainCode ||
      seg?.LocalDomainCode ||
      seg?.JourneyName ||
      seg?.LongName ||
      seg?.Number ||
      '—'
    );
  }

  getSegmentIcon(segment: any): string {
    const mode = String(segment?.TransportMode || segment?.Mode || '').toLowerCase();

    if (mode.includes('bus') || mode.includes('volan') || mode.includes('agglo')) return 'icons/bus.svg';
    if (mode.includes('tram')) return 'icons/tram.svg';
    if (mode.includes('metro')) return 'icons/metro.svg';
    return 'icons/train.svg';
  }

  // ---- időkezelés a template-hez ----
  private cleanTime(v: any): string {
    const s = String(v ?? '').trim();
    if (!s) return '';
    const low = s.toLowerCase();
    if (low === 'n.a.' || low === 'n.a' || low === 'na') return '';
    return s;
  }

  isExpected(v: any): boolean {
    // akkor várható, ha tényleg van érték (nem n.a. és nem "")
    return !!this.cleanTime(v);
  }

  pickTime(expected: any, scheduled: any): string {
    // ha van várható -> azt adjuk vissza, különben a menetrendit
    const e = this.cleanTime(expected);
    const s = this.cleanTime(scheduled);
    return e || s || '';
  }

  onClose() {
    this.close.emit();
  }
}