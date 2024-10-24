import { Component } from '@angular/core';
import { AuthenticationService } from '../../../auth/services/authentication.service';
import { Router, RouterOutlet } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-chatroom',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss'],
  providers: [AuthenticationService]
})

export class ChatroomComponent {
  public shortName: string = ""
  profileSrc: string | null = ""
  name: string | null = ""
  email: string | null = ""

  constructor(private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    if (sessionStorage.getItem("reloaded") !== "true") {
      sessionStorage.setItem("reloaded", "true");
      location.reload();
    }

    this.authService.currentUser.subscribe((user) => {
        if (user) {
            console.log(user);
              this.shortName = `${user.displayName?.split(" ")[0]}`;
              this.profileSrc = user.photoURL;
  
              //For modal:
              this.name = user.displayName;
              this.email = user.email;
        }
    });
  }

  ngOnDestroy() { 
    this.authService.currentUser.unsubscribe();
  }

  //----
  logOut() {
    this.authService.logOut().subscribe({
      next: (res) => {
        this.router.navigate(["/"]);
        this.authService.currentUser = new BehaviorSubject<User | null>(null);
      }
    });
  }

  //handle modal:
  public modalOpacity: string = "opacity: 0; visibility: hidden; pointer-events: none;";

  showModal() {
    this.modalOpacity = "opacity: 1 ; visibility: visible; pointer-events: all;";
  }

  closeModal() {
    this.modalOpacity = "opacity: 0 ; visibility: hidden; pointer-events: none;";
  }
}