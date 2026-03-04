import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cookie-consent',
  standalone: false,
  templateUrl: './cookie-consent.component.html',
  styleUrl: './cookie-consent.component.css'
})
export class CookieConsentComponent implements OnInit {
  visible = false;

  private readonly KEY = 'cookie_consent_ok_v1';

  ngOnInit(): void {
    const ok = localStorage.getItem(this.KEY);
    this.visible = ok !== '1';
  }

  accept(): void {
    localStorage.setItem(this.KEY, '1');
    this.visible = false;
  }
}
