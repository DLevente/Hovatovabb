import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert',
  standalone: false,
  templateUrl: './alert.component.html',
  styleUrl: './alert.component.css'
})
export class AlertComponent {
  @Input() message = '';

  close() {
    document.getElementById('toast').classList.remove('show');
  }
}