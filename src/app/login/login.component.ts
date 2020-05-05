import { Router } from '@angular/router';
import { AUTENTICATE_USER_MUTATION, SIGNUP_USER_MUTATION } from './../graphql';
import { Apollo } from 'apollo-angular';
import { AuthService } from './../auth.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  login = true; // switch between login and signup
  email = '';
  password = '';
  name = '';

  constructor(
    private authService: AuthService,
    private apollo: Apollo,
    private router: Router
  ) {}

  ngOnInit() {}

  confirm() {
    if (this.login) {
      this.apollo
        .mutate({
          mutation: AUTENTICATE_USER_MUTATION,
          variables: {
            email: this.email,
            password: this.password
          }
        })
        .subscribe(
          result => {
            console.log(result);
            const id = result.data.authenticateUser.id;
            const token = result.data.authenticateUser.token;
            this.authService.saveUserData(id, token);
          },
          error => alert(error)
        );
    } else {
      this.apollo
        .mutate({
          mutation: SIGNUP_USER_MUTATION,
          variables: {
            name: this.name,
            password: this.password,
            email: this.email
          }
        })
        .subscribe(
          result => {
            const id = result.data.authenticateUser.id;
            const token = result.data.authenticateUser.token;
            console.log(result);
            this.authService.saveUserData(id, token);
          },
          error => alert(error)
        );
    }
    this.router.navigate(['/']);
  }
}
