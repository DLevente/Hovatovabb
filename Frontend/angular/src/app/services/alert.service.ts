import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private messageSubject = new BehaviorSubject<string | null>(null);
  public message$: Observable<string | null> = this.messageSubject.asObservable();

  show(message: string) {
    this.messageSubject.next(message);

    setTimeout(() => {
      this.clear();
    }, 3000);
  }

  clear() {
    this.messageSubject.next(null);
  }
}