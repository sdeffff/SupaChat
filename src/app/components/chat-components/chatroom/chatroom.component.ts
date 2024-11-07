import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

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
    this.getFriends();

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

  async searchFriend(name: string) {
    if(name.trim() === "") {
      this.searchResults = [];
      return;
    }

    try {
      this.searchResults = await this.chatService.searchFriend(name);
    } catch (err) {
      console.log("Error while trying to search value in database: " + err);
    }
  }

  //Send request to add friend:
  sendRequest(friend: {name: string, uid: string}) {
    this.chatService.sendRequest(friend);
  }

  //Get requests from db:
  public requests: Array<{name: string, uid: string, pfp: string}> = [];

  async getRequests() {
    this.requests = await this.chatService.getRequests();
  }

  //Get friends of current user from db:
  public friends: Array<{name: string, uid: string, pfp: string}> = [];


  //Accepting the request from another user:
  async acceptRequest(request: {name: string, uid: string, pfp: string}) {
    await this.chatService.acceptRequest(request);
    window.location.reload();
  }

  async getFriends() {
    this.friends = await this.chatService.getFriends();
  }

  //Creating chat:
  async changeChat(uid: string) {
    await this.chatService.changeChat(uid);
    await this.getMessages();
  }

  //Send message:
  public inputMessage: string = "";
  sendMessage() {
    this.chatService.sendMessage(this.inputMessage);
  }

  //Get messages from db:
  public messages: Array<{content: string, senderId: string, timestamp: number}> = [];

  async getMessages() {
    this.messages = await this.chatService.getMessages();
    console.log(this.messages, localStorage);
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