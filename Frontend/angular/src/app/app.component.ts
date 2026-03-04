import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { UserService } from './services/user.service';
import { AlertService } from './services/alert.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: false
})
export class AppComponent {
  title = 'hovatovabb';
  activeTab: 'search' | 'plan' | 'details' = 'search';

  isLegal = false;

  kedvId: number = 3;

  ngOnInit(): void {
    this.userService.user$.subscribe((res: any) => {
      const u = res?.user ?? res;
      this.kedvId = u?.kedv_id ?? 3;
    });
  }

  constructor(
    public userService: UserService,
    public alertService: AlertService,
    private router: Router
  ) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.isLegal = this.router.url.startsWith('/jogi-informaciok');
      });
  }

  get user$() {
    return this.userService.user$;
  }

  showLogin = false;
  showRegister = false;
  showUser = false;

  logout() {
    this.userService.logout();
  }

  selectedPlan: any = null;

  openPlan(plan: any) {
    this.selectedPlan = plan;
    this.activeTab = 'details';
  }

  backToPlans() {
    this.selectedPlan = null;
    this.activeTab = 'plan';
  }

  logoutBtn() {
    this.userService.logout();
    this.alertService.show('Sikeresen kijelentkeztél!');
  }
}
