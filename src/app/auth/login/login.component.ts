import { Component } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { Router, RouterOutlet } from '@angular/router';
//Imports for the form:
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
//Models:
import { UserModel } from '../../../models/user.model';
import { GoogleUser } from '../../../models/google_user.model';
import { response } from 'express';

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

  private _googleUser: GoogleUser = {
    email: "",
    name: "",
    pfp: "",
  }

  get user(): UserModel {
    return this._user;
  }

  get googleUser(): GoogleUser {
    return this._googleUser;
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

    this.authService.currentUser.subscribe((user) => {
      this._googleUser = {
        email: user!.email,
        name: user!.displayName,
        pfp: user!.photoURL,
      }
    });
  }

  logInEmailPassword() {
    this.authService.logInEmailPassword(this._user.email, this._user.pwd, this._user.name).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  logOut() {
    this._googleUser = {
      email: "",
      name: "",
      pfp: "",
    }

    this.authService.logOut().subscribe();

    this.router.navigate(["/login"]);
  }

  showData() {
    console.log(this._googleUser);
  }
}