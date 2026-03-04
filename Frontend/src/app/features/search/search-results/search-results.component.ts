import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PlanService } from '../../../services/plan.service';
import { UserService } from '../../../services/user.service';
import { JourneyResult } from '../../../models.model';
import { AlertService } from '../../../services/alert.service';
import { map, switchMap, take } from 'rxjs';

@Component({
  selector: 'app-search-results',
  standalone: false,
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {
  @Input() selectedDate = '';
  @Input() journeys: JourneyResult[] = [];
  @Input() kedvId: number = 3;
  @Output() info = new EventEmitter<any>();
  @Input() date: string = "";

  username = '';
  plans: any[] = [];

  showAddModal = false;
  selectedJourney: any = null;
  selectedPlanId: number | null = null;

  constructor(
    private userService: UserService,
    private planService: PlanService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.userService.user$.subscribe((res: any) => {
      const u = res?.user ?? res;
      this.username = u?.felhasznalonev ?? '';
      if (this.username) this.loadPlans();
    });
  }

  loadPlans(done?: () => void) {
    this.planService.getPlans(this.username).subscribe({
      next: (p: any[]) => {
        this.plans = p || [];
        done?.();
      },
      error: (e) => console.error(e)
    });
  }

  openAddModal(journey: any) {
    this.selectedJourney = journey;
    this.selectedPlanId = null;
    this.showAddModal = true;
    this.loadPlans();
  }

  closeAddModal() {
    this.showAddModal = false;
    this.selectedJourney = null;
    this.selectedPlanId = null;
  }

  newPlanName = '';

  createPlan() {
    if (!this.username) return;

    const nev = (this.newPlanName || 'Új terv').trim();

    this.planService.addPlan(this.username, nev).subscribe({
      next: (res: any) => {
        const newId = res?.tervId;
        // 1) újratöltjük a terveket
        this.loadPlans(() => {
          // 2) és kiválasztjuk az új tervet
          this.selectedPlanId = Number(newId);
        });

        this.alertService.show('Új terv (' + nev + ') létrehozva.');
        this.newPlanName = '';
      },
      error: (e) => console.error(e)
    });


  }

  confirmAdd() {
    if (!this.selectedJourney || !this.selectedPlanId) return;

    const tervId = this.selectedPlanId;
    const date = this.selectedDate || new Date().toISOString().split('T')[0];

    this.planService.getPlanRoutes(tervId).pipe(
      map((routes: any[]) => (routes?.length ?? 0) + 1),
      switchMap((order: number) =>
        this.planService.addJourneyToPlan(this.selectedJourney, tervId, order, date)
      )
    ).subscribe({
      next: () => {
        this.closeAddModal();
        this.alertService.show('Járat sikeresen hozzáadva a tervhez.');

        this.userService.user$.pipe(take(1)).subscribe((res: any) => {
          const u = res?.user ?? res;
          const username = u?.felhasznalonev ?? '';
          if (username) {
            this.planService.reloadPlans(username).subscribe(); // <- fontos subscribe
          }
        });
      },
      error: (e) => {
        console.error(e);
        this.alertService.show('Nem sikerült hozzáadni a járatot a tervhez.');
      }
    });
  }

  showInfo = false;

  onInfo(journey: any) {
    this.info.emit(journey);
    this.showInfo = true;
  }
}