import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserService } from '../../../services/user.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-user',
  standalone: false,
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  user: any = null;

  email = '';
  teljes_nev = '';
  kedvId: number | null = null;
  password = '';

  username = '';

  constructor(private userService: UserService, private alertService: AlertService) { }

  ngOnInit() {
    this.userService.user$.subscribe((res: any) => {
      const u = res?.user ?? res;
      this.user = u;

      if (u) {
        this.email = u.email ?? '';
        this.teljes_nev = u.teljes_nev ?? '';
        this.kedvId = Number(u.kedv_id ?? 3);
      }
    });
  }

  private applyUser(user: any) {
    this.user = user;
    this.email = user.email ?? '';
    this.teljes_nev = user.teljes_nev ?? '';
    this.kedvId = Number(user.kedv_id ?? 3);
  }


  save() {
    if (!this.user) return;

    this.userService
      .editUser(
        this.user.felhasznalonev,
        this.email,
        this.teljes_nev,
        this.kedvId!,
        this.password || undefined
      )
      .subscribe({
        next: () => {
          this.alertService.show(`Felhasználó sikeresen módosítva!\nKérlek, jelentkezz be újra!`);
          this.close.emit();
          this.userService.logout();
        }
      });
  }

  delete() {
    let userPrompt = prompt("Felhasználó törléséhez írja be felhasználónevét!");
    if (userPrompt === this.user.felhasznalonev) {
      this.userService.deleteUser(this.user.felhasznalonev).subscribe();
      this.close.emit();
    }
    this.userService.logout();
  }

  onClose() {
    this.close.emit();
  }
}
