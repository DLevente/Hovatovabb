import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { PlanService } from '../../services/plan.service';
import { AlertService } from '../../services/alert.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

type PlanMeta = {
  count: number;
  firstDeparture: string | null;
};

@Component({
  selector: 'app-plan',
  standalone: false,
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.css']
})
export class PlanComponent implements OnInit {
  @Output() viewPlan = new EventEmitter<any>();

  showLogin = false;

  username = '';
  plans: any[] = [];
  loading = false;
  error = '';

  showCreateModal = false;
  planName = '';

  deleteModalOpen = false;
  planToDelete: any = null;

  private sub = new Subscription();

  planMeta: Record<number, PlanMeta> = {};

  constructor(
    private userService: UserService,
    private planService: PlanService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.sub.add(
      this.planService.plans$.subscribe(plans => {
        this.plans = plans || [];

        if (this.plans.length > 0) {
          this.loadPlanMeta();
        } else {
          this.planMeta = {};
        }
      })
    );

    this.sub.add(
      this.userService.user$.subscribe((res: any) => {
        const u = res?.user ?? res;
        this.username = u?.felhasznalonev ?? '';
        if (this.username) {
          this.loading = true;
          this.planService.reloadPlans(this.username).subscribe({
            next: () => (this.loading = false),
            error: (e) => {
              console.error(e);
              this.error = 'Nem sikerült betölteni a terveket.';
              this.loading = false;
            }
          });
        }
      })
    );
  }

  loadPlans() {
    this.loading = true;
    this.error = '';

    this.planService.getPlans(this.username).subscribe({
      next: (p) => {
        this.plans = p || [];

        if (!this.plans.length) {
          this.planMeta = {};
          this.loading = false;
          return;
        }

        // 🔥 meta betöltés (első indulás + darabszám)
        this.loadPlanMeta();
      },
      error: (e) => {
        this.error = 'Nem sikerült betölteni a terveket.';
        this.loading = false;
        console.error(e);
      }
    });
  }

  private loadPlanMeta() {
    forkJoin(
      this.plans.map((p) => {
        const planId = Number(p.id);

        return this.planService.getPlanRoutes(planId).pipe(
          map((routes: any[]) => {
            const arr = Array.isArray(routes) ? routes : [];
            const firstDeparture = arr.length ? (arr[0]?.ind_ido ?? null) : null;

            return {
              planId,
              meta: { count: arr.length, firstDeparture } as PlanMeta
            };
          }),
          catchError(() =>
            of({ planId, meta: { count: 0, firstDeparture: null } as PlanMeta })
          )
        );
      })
    ).subscribe((results: any[]) => {
      const meta: Record<number, PlanMeta> = {};
      results.forEach(r => (meta[Number(r.planId)] = r.meta));
      this.planMeta = meta;
      this.loading = false;
    });
  }

  getCount(planId: any): number {
    const id = Number(planId);
    return this.planMeta?.[id]?.count ?? 0;
  }

  getFirstDeparture(planId: any): string | null {
    const id = Number(planId);
    return this.planMeta?.[id]?.firstDeparture ?? null;
  }

  toDateSafe(dt: string | null): Date | null {
    if (!dt) return null;
    const fixed = dt.includes(' ') ? dt.replace(' ', 'T') : dt;
    const d = new Date(fixed);
    return isNaN(d.getTime()) ? null : d;
  }

  open(plan: any) {
    this.viewPlan.emit(plan);
  }

  delete(plan: any) {
    this.planToDelete = plan;
    this.deleteModalOpen = true;
  }

  openCreate() { this.showCreateModal = true; }
  closeCreate() { this.showCreateModal = false; }

  createPlan() {
    if (!this.username) return;

    const nev = (this.planName || 'Új terv').trim();

    this.alertService.show('Új terv (' + nev + ') létrehozva.');

    this.planService.addPlan(this.username, nev).subscribe({
      next: () => {
        this.planName = '';
        this.closeCreate();
        this.loadPlans();
      },
      error: (e) => console.error(e)
    });
  }

  confirmDelete() {
    if (!this.planToDelete) return;

    this.planService.deletePlan(this.planToDelete.id).subscribe({
      next: () => {
        this.loadPlans();
        this.alertService.show('Terv sikeresen törölve.');
        this.closeDeleteModal();
      },
      error: (e) => console.error(e)
    });
  }

  closeDeleteModal() {
    this.deleteModalOpen = false;
    this.planToDelete = null;
  }
}