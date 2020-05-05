import { AuthService } from './../auth.service';
import { Component, OnInit } from '@angular/core';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  logged = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.isAuthenticated
      .pipe(distinctUntilChanged())
      .subscribe(status => (this.logged = status));
  }
  logout() {
    this.authService.logout();
  }
}
