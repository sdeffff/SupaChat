import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router, RouterOutlet } from '@angular/router';
//Imports for the form:
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
//Models:
import { UserModel } from '../../../models/user.model';
import { GoogleUser } from '../../../models/login.model';

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
  private _user: UserModel = {
    name: "",
    email: "",
    pwd: "",
    confirmPwd: ""
  }

  get user(): UserModel {
    return this._user;
  }

  constructor(private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    //Checking if the user exists, if so, redirect to the chatroom
    this.authService.currentUser.subscribe((user) => {
      if (user) {
        this.router.navigate(["/chatroom"]);
      }
    });
  }

  logInGoogle() {
    this.authService.logInGoogle().subscribe({
      next: (res) => {
        this.router.navigate(["/chatroom"]);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  createNewUser() {
    this.authService.registerEmailPassword(this._user.email, this._user.pwd, this._user.name).subscribe({
      next: (res) => {
        console.clear();
        console.log(res);
      },
      error: (err) => {
        if(err.message.includes("auth/email-already-in-use")) {
          alert("This email is already in use");

          this._user.email = "";
          this._user.pwd = "";
          this._user.confirmPwd = "";

          console.clear();
        }
      }
    });
  }

  logInUser() {
    this.authService.logInEmailPassword(this._user.email, this._user.pwd, this._user.name).subscribe({
      next: (res) => {
        console.clear();
        console.log(res);
      },
      error: (err) => {
        if(err.message.includes("auth/invalid-credential")) {
          alert("Invalid password for email");

          this._user.pwd = "";
          this._user.confirmPwd = "";

          console.clear();
        }
      }
    });
  }
}