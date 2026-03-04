import { Component, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  username = '';
  password = '';
  email = '';
  teljes_nev = '';
  kedvId = 3;
  error = '';

  @Output() close = new EventEmitter<void>();

  constructor(private user: UserService, private alertService: AlertService) { }

  submit() {
    if (!this.username || !this.password || !this.email || !this.teljes_nev) {
      this.error = 'Kérlek töltsd ki az összes mezőt!';

      if (!this.username) {
        document.getElementById('username').style.border = '1px solid #f87171';
      }
      else {
        document.getElementById('username').style.border = '1px solid #374151';
      }

      if (!this.password) {
        document.getElementById('password').style.border = '1px solid #f87171';
      }
      else {
        document.getElementById('password').style.border = '1px solid #374151';
      }

      if (!this.email) {
        document.getElementById('email').style.border = '1px solid #f87171';
      }
      else {
        document.getElementById('email').style.border = '1px solid #374151';
      }

      if (!this.teljes_nev) {
        document.getElementById('teljes_nev').style.border = '1px solid #f87171';
      }
      else {
        document.getElementById('teljes_nev').style.border = '1px solid #374151';
      }

      if (!this.kedvId) {
        document.getElementById('kedvId').style.border = '1px solid #f87171';
      }
      else {
        document.getElementById('kedvId').style.border = '1px solid #374151';
      }
      return;
    }

    if (!this.user.isEmailValid(this.email)) {
      this.error = 'Érvénytelen e-mail cím!';
      document.getElementById('email').style.border = '1px solid #f87171';
      document.getElementById('teljes_nev').style.border = '1px solid #374151';
      document.getElementById('kedvId').style.border = '1px solid #374151';
      document.getElementById('password').style.border = '1px solid #374151';
      document.getElementById('username').style.border = '1px solid #374151';
      return;
    }

    if (!this.user.isPasswordValid(this.password)) {
      this.error = 'A jelszó nem elég erős!';
      document.getElementById('password').style.border = '1px solid #f87171';
      document.getElementById('teljes_nev').style.border = '1px solid #374151';
      document.getElementById('kedvId').style.border = '1px solid #374151';
      document.getElementById('email').style.border = '1px solid #374151';
      document.getElementById('username').style.border = '1px solid #374151';
      return;
    }

    this.user.register(this.username, this.password, this.email, this.teljes_nev, this.kedvId)
      .subscribe({
        next: () => {
          this.alertService.show(`Regisztráció sikeres!`);
          this.close.emit()
        },
        error: () => this.error = 'Regisztráció sikertelen'
      });
  }

  onClose() {
    this.close.emit();
  }
}
