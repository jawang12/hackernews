import { GC_USER_ID, GC_AUTH_TOKEN } from './constants';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userId = null;
  private _isAuthenticated = new BehaviorSubject(false);

  get isAuthenticated(): Observable<boolean> {
    return this._isAuthenticated.asObservable();
  }

  saveUserData(id: string, token: string) {
    localStorage.setItem(GC_USER_ID, id);
    localStorage.setItem(GC_AUTH_TOKEN, token);
    this.setUserId(id);
  }

  setUserId(id: string) {
    this.userId = id;
    this._isAuthenticated.next(true);
  }

  logout() {
    localStorage.removeItem(GC_AUTH_TOKEN);
    localStorage.removeItem(GC_USER_ID);
    this.userId = null;
    this._isAuthenticated.next(false);
  }

  autoLogin() {
    const id = localStorage.getItem(GC_USER_ID);
    if (id) {
      this.setUserId(id);
    }
  }
}
