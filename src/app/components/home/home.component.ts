import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthenticationService } from '../../auth/services/authentication.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  providers: [AuthenticationService]
})
export class HomeComponent {

  constructor(private authService: AuthenticationService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser.subscribe((user) => {
      if(user) {
        this.router.navigate(["/chatroom"]);
      }
    });
  }
}