import { Component, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  @Output() close = new EventEmitter<void>();

  constructor(private user: UserService, private alertService: AlertService) { }

  submit() {
    this.loading = true;
    this.error = '';

    if (!this.username || !this.password) {
      this.error = 'Kérlek töltsd ki az összes mezőt!';
      if (!this.username) document.getElementById('username').style.border = '1px solid #f87171';
      if (!this.password) document.getElementById('password').style.border = '1px solid #f87171';
      return;
    }
    else if (!this.username) {
      this.error = 'Kérlek add meg a felhasználóneved!';
      document.getElementById('username').style.border = '1px solid #f87171';
      document.getElementById('password').style.border = '1px solid #374151';
      return;
    }
    else if (!this.password) {
      this.error = 'Kérlek add meg a jelszavad!';
      document.getElementById('password').style.border = '1px solid #f87171';
      document.getElementById('username').style.border = '1px solid #374151';
      return;
    }
    else {
      this.user.login(this.username, this.password).subscribe({
        next: (res) => {
          this.loading = false;
          this.close.emit();
          this.alertService.show(`Üdvözlünk, ${res.user.teljes_nev}!`);
        },
        error: () => {
          this.loading = false;
          this.error = 'Hibás felhasználónév vagy jelszó';
        },
      });
    }
  }

  onClose() {
    this.close.emit();
  }
}
