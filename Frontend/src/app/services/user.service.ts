import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  baseUrl = 'https://api.hova-tovabb.hu';

  // 🔹 auth state
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    // oldalfrissítés után visszatöltjük a usert
    const stored = localStorage.getItem('user');
    if (stored) {
      this.userSubject.next(JSON.parse(stored));
    }
  }

  // 🔹 aktuális user szinkron eléréshez
  get currentUser() {
    return this.userSubject.value;
  }

  // 🔹 LOGIN
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, {
      felhasznalonev: username,
      jelszo: password
    }).pipe(
      tap(user => {
        this.userSubject.next(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  // 🔹 LOGOUT
  logout() {
    this.userSubject.next(null);
    localStorage.removeItem('user');
  }

  // 🔹 REGISTER
  register(
    username: string,
    password: string,
    email: string,
    tel: string,
    kedvId: number
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/register`, {
      felhasznalonev: username,
      jelszo: password,
      email,
      teljes_nev: tel,
      kedv_id: kedvId
    });
  }

  // 🔹 USER UPDATE
  editUser(
    username: string,
    email: string,
    tel: string,
    kedvId: number,
    password?: string
  ): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/user/${username}`, {
      email,
      teljes_nev: tel,
      kedv_id: kedvId,
      jelszo: password
    }).pipe(
      tap(() => {
        const current = this.userSubject.value;

        const updatedUser = {
          ...current,
          email,
          teljes_nev: tel,
          kedv_id: kedvId
        };

        this.userSubject.next(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      })
    );
  }


  // 🔹 USER DELETE (opcionális)
  deleteUser(username: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/user/${username}`);
  }

  // 🔹 EMAIL VALIDATION
  isEmailValid(email: string): boolean {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  // 🔹 PASSWORD VALIDATION
  isPasswordValid(password: string): boolean {
    return password.length >= 8 && password.match(/[0-9]/) && password.length <= 20;
  }

  getLoggedInUser(): any {
    return this.userSubject.value;
  }
}
