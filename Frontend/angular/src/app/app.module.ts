import { BrowserModule } from '@angular/platform-browser';
import { NgModule, isDevMode } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';
import { SearchComponent } from './features/search/search.component';
import { SearchFormComponent } from './features/search/search-form/search-form.component';
import { SearchResultsComponent } from './features/search/search-results/search-results.component';
import { JourneyCardComponent } from './features/search/journey-card/journey-card.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { JourneyInfoComponent } from './features/search/journey-info/journey-info.component';
import { LoginComponent } from './features/user/login/login.component';
import { RegisterComponent } from './features/user/register/register.component';
import { UserComponent } from './features/user/user/user.component';
import { AlertComponent } from './features/misc/alert/alert.component';
import { PlanComponent } from './features/plan/plan.component';
import { PlanDetailsComponent } from './features/plan/plan-details/plan-details.component';
import { PlanCardComponent } from './features/plan/plan-card/plan-card.component';
import { CookieConsentComponent } from './features/misc/cookie-consent/cookie-consent.component';
import { LegalComponent } from './features/misc/legal/legal.component';

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    SearchFormComponent,
    SearchResultsComponent,
    JourneyCardComponent,
    JourneyInfoComponent,
    LoginComponent,
    RegisterComponent,
    UserComponent,
    AlertComponent,
    PlanComponent,
    PlanDetailsComponent,
    PlanCardComponent,
    CookieConsentComponent,
    LegalComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }