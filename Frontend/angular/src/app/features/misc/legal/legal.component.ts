import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-legal',
  standalone: false,
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.css'
})
export class LegalComponent {
  constructor(private router: Router) { }

  goBackFromLegal() {
    this.router.navigateByUrl('/');
  }
}
