import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../services/authentication.service';
import { userInfo } from 'os';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { UserModel } from '../../../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [AuthenticationService]
})
export class LoginComponent {
  public uid: string = "";

  //Users data:
  _user: UserModel = {
    email: "",
    pwd: "",
    confirmPwd: ""
  }

  get user(): UserModel {
    return this._user;
  }

  constructor(private authService: AuthenticationService) {}

  ngOnInit() {
    console.log(this.authService.currentUser);
  }

  logInGoogle() {
    this.authService.logInGoogle().subscribe(
      (userInfo) => {
        if(userInfo && !this.authService.currentUser.hasError) {
          //navigate to chatroom
          //...
          this.uid = userInfo.user.uid;
        }
      }
    )
  }

  logOut() {
    this.uid = "";

    this.authService.logOut().subscribe();

    //navigate to login page
    //...
    console.log(this.authService.currentUser, this.uid);
  }
}