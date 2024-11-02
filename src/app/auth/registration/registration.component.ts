import { Component } from '@angular/core';
//For html:
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
//Router:
import { Router, RouterOutlet } from '@angular/router';
//Service:
import { AuthenticationService } from '../services/authentication.service';
//Model:
import { RegisterModel } from '../../../models/register.model';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgIf],
  templateUrl: './registration.component.html',
  styleUrl: '../login/login.component.scss',
  providers: [AuthenticationService],
})
export class RegistrationComponent {
  constructor(private authService: AuthenticationService, private router: Router) { }

  private _user: RegisterModel = {
    name: "",
    email: "",
    pwd: "",
    confirmPwd: "",
  }

  get user(): RegisterModel {
    return this._user;
  }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

    if(user && user.emailVerified) {
      this.router.navigate(["/chatroom"]);
    }
  }

  registerUser() {
    this.authService.registerEmailPassword(this._user.email, this._user.pwd, this._user.name).subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (err) => {
        if(err.message.includes("auth/email-already-in-use")) {
          alert("Email already in use");
        }
      }
    });
  }

  logInGoogle() {
    this.authService.logInGoogle().subscribe({
      next: (res) => {
        console.log(res);
      },
      error: (err) => {
        console.error(err);
      }
    });
  }
}
