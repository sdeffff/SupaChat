import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router, RouterOutlet } from '@angular/router';
//Imports for the form:
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
//Models:
import { LogInModel } from '../../../models/login.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [AuthenticationService]
})
export class LoginComponent {
  //Users data:
  private _user: LogInModel = {
    email: "",
    pwd: "",
  }

  get user(): LogInModel {
    return this._user;
  }

  constructor(private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    //Checking if the user exists, if so, redirect to the chatroom
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if(user && user.emailVerified) {
      this.router.navigate(["/chatroom"]);
    }
  }

  logInGoogle() {
    this.authService.logInGoogle().subscribe({
      next: (res) => {
        this.router.navigate(["/chatroom"]);
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  logInUser() {
    this.authService.logInEmailPassword(this._user.email, this._user.pwd).subscribe({
      next: (res) => {
        console.log(res);

        if(!res.emailVerified) {
          alert("Please verify your email address");
        }
      },
      error: (err) => {
        if(err.message.includes("auth/invalid-credential")) {
          alert("Invalid password for email");

          this._user.pwd = "";
        }
      }
    });
  }
}