import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';

//Database:
import { ref, get, set, update } from 'firebase/database';
import { db } from '../../../../environments/environment.dev';

//Imports:
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

//Services:
import { ChatService } from '../services/chat-service.service';
import { AuthenticationService } from '../../../auth/services/authentication.service';

@Component({
  selector: 'app-chatroom',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgFor],
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.scss'],
  providers: [AuthenticationService, ChatService]
})

export class ChatroomComponent {
  public shortName: string = ""
  profileSrc: string | null = ""
  name: string | null = ""
  email: string | null = ""

  constructor(
    private authService: AuthenticationService, 
    private router: Router,
    private chatService: ChatService) {};

  ngOnInit() {
    this.getRequests();

    //Checking if the user is logged in:
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');

      if (user && user.emailVerified) {
        this.shortName = `${user.displayName?.split(" ")[0]}`;
        this.profileSrc = user.photoURL;
  
        // For modal:
        this.name = user.displayName;
        this.email = user.email;
      } else {
        this.router.navigate(["/"]);
      }
  }

  //----
  logOut() {
    this.authService.logOut().subscribe({
      next: (res) => {
        this.router.navigate(["/"]);
      }
    });
  }

  //Add friend functionality:
  public friendName: string = "";
  public searchResults: Array<{name: string, uid: string}> = [];
  public friends: Array<{name: string, uid: string}> = [];

  async searchFriend(name: string) {
    if(name.trim() === "") {
      this.searchResults = [];
      return;
    }

    try {
      const userRef = ref(db, 'users/');

      const snapshot = await get(userRef);
      if(snapshot.exists()) {
        const users = snapshot.val();

        this.searchResults = Object.values(users)
            .filter((user: any) =>
                user.name && user.name.toLowerCase().includes(name.toLowerCase())
            )
            .map((user: any) => ({
              name: user.name,
              uid: user.uid,
            }));
      } else {
        this.searchResults = [];
      }

    } catch (err) {
      console.log("Error while trying to search value in database: " + err);
    }
  }

  sendRequest(friend: {name: string, uid: string}) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const ownRequestsRef = ref(db, "requests/" + currentUser.uid + "/ownRequests"),
          friendRequestsRef = ref(db, "requests/" + friend.uid + "/friendRequests");

    update(ownRequestsRef, {
      [friend.uid]: {
        name: friend.name,
        uid: friend.uid,
        status: "requested",
      }
    })

    update(friendRequestsRef, {
      [currentUser.uid]: {
        name: currentUser.displayName,
        uid: currentUser.uid,
        status: "requested",
      }
    })
  }

  //Get requests from db:
  public requests: Array<{name: string, uid: string}> = [];

  async getRequests() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const requestsRef = ref(db, "requests/" + currentUser.uid + "/friendRequests");

    const snapshot = await get(requestsRef);

    if(snapshot.exists()) {
      const friendRequests = snapshot.val();

      this.requests = Object.values(friendRequests)
                                    .map((request: any) => ({
                                      name: request.name,
                                      uid: request.uid,
                                    }))
    } else {
      this.requests = [];
    }
  }

  //handle modals:
  public modalOpacity: string = "opacity: 0; visibility: hidden; pointer-events: none;";
  public addFriendModalOpacity: string = "opacity: 0; visibility: hidden; pointer-events: none;";

  showModal(modal: string) {
    if (modal === "friends") {
      this.addFriendModalOpacity = "opacity: 1 ; visibility: visible; pointer-events: all;";
    } else {
      this.modalOpacity = "opacity: 1 ; visibility: visible; pointer-events: all;";
    }
  }

  closeModal() {
    this.modalOpacity = "opacity: 0 ; visibility: hidden; pointer-events: none;";
    this.addFriendModalOpacity = "opacity: 0 ; visibility: hidden; pointer-events: none;";
  }
}