import { Component } from '@angular/core';
import { AuthenticationService } from '../../../auth/services/authentication.service';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-chatroom',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './chatroom.component.html',
  styleUrl: './chatroom.component.scss',
  providers: [AuthenticationService]
})
export class ChatroomComponent {
  public greeting: string = ""
  profileSrc: string | null = "";

  constructor(private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser.subscribe((user) => {
        if (user) {
            console.log(user);
            this.greeting = `Hello, ${user.displayName}!`;
            this.profileSrc = user.photoURL;
        } else {
            console.log("User not found");
        }
    });
  }

  ngOnDestroy() { 
    this.authService.currentUser.unsubscribe();
  }
}
