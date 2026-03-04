import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LegalComponent } from './features/misc/legal/legal.component';

const routes: Routes = [
  { path: 'jogi-informaciok', component: LegalComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
