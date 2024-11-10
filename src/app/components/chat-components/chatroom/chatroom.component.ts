import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

//Imports:
import { FormsModule } from '@angular/forms';
import { NgFor, NgClass } from '@angular/common';

//Services:
import { ChatService } from '../services/chat-service.service';
import { AuthenticationService } from '../../../auth/services/authentication.service';

@Component({
  selector: 'app-chatroom',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgFor, NgClass],
  templateUrl: './chatroom.component.html',
  styleUrls: ['./aside.component.scss', './main.component.scss', './modal.component.scss'],
  providers: [AuthenticationService, ChatService]
})

export class ChatroomComponent {
  public shortName: string = ""
  profileSrc: string | null = ""
  name: string | null = ""
  email: string | null = "";


  @ViewChild('chatContainer') chat!: ElementRef;

  constructor(
    private authService: AuthenticationService, 
    private router: Router,
    private chatService: ChatService) {};

  ngOnInit() {
    this.getRequests();
    this.getFriends();
    localStorage.setItem('currentUserChat', "");
    localStorage.setItem('currentChat', "");

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

  ngAfterViewInit() {
    try {
      this.chat.nativeElement.scrollTo({
        top: this.chat.nativeElement.scrollHeight,
        behavior: 'smooth'
      });
    } catch (err) {
      console.error('Scrolling failed:', err);
    }
  }

  //----
  logOut() {
    this.authService.logOut().subscribe({
      next: () => { 
        this.router.navigate(["/"]);
      }
    });
  }

  //Add friend functionality:
  public friendName: string = "";
  public searchResults: Array<{name: string, uid: string, pfp: string}> = [];

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
    this.chatService.sendRequest(friend).subscribe();
  }

  //Get requests from db:
  public requests: Array<{name: string, uid: string, pfp: string}> = [];

  getRequests() {
    this.chatService.getRequests().subscribe((res) => {
      this.requests = res;
    });
  }

  //Get friends of current user from db:
  public friends: Array<{name: string, uid: string, pfp: string}> = [];

  //Accepting the request from another user:
  async acceptRequest(request: {name: string, uid: string, pfp: string}) {
    await this.chatService.acceptRequest(request);
    window.location.reload();
  }

  getFriends() {
    this.chatService.getFriends().subscribe({
      next: (data) => {this.friends = data},
      error: (err) => {console.log(err)}
    });
  }

  public messages: Array<{content: string, senderId: string, timestamp: number}> = [];

  //Creating chat:
  changeChat(uid: string) {
    this.chatService.changeChat(uid).subscribe((messages) => {
      this.messages = messages;
    });
  }

  //Send message:
  public inputMessage: string = "";

  sendMessage() {
    if(localStorage.getItem('currentUserChat') === "") return;

    this.chatService.sendMessage(this.inputMessage).subscribe({
      next: (messages) => {
        this.inputMessage = "";
        this.messages = messages;
      }
    });

    this.chat.nativeElement.scrollTo({
      top: this.chat.nativeElement.scrollHeight,
      behavior: 'smooth'
    });
  }

  getPfp(uid: string) {
    if(uid === JSON.parse(localStorage.getItem('currentUser')!).uid) return this.profileSrc;

    for(let friend of this.friends) {
      if(friend.uid === uid) return friend.pfp;
    }

    return '';
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

  //set styles for the messages:
  getUserClass(senderId: string) {
    return senderId === JSON.parse(localStorage.getItem('currentUser')!).uid ? "current-user" : "other-user";
  }
}