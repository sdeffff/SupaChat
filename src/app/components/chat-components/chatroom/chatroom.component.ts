import { Component } from '@angular/core';
import { AuthenticationService } from '../../../auth/services/authentication.service';
import { Router, RouterOutlet } from '@angular/router';

//Firestore:
import { db } from '../../../../environments/environment.dev';
import { collection, doc, setDoc, getDocs, query, where, QuerySnapshot, DocumentData } from 'firebase/firestore';

//Imports:
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-chatroom',
  standalone: true,
  imports: [RouterOutlet, FormsModule, NgFor],
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

      //Code for the chatroom:
      const messages = collection(db, "messages");
      const message = {
        name: "John",
        message: "Hello",
        time: new Date().toLocaleTimeString(),
      }

      setDoc(doc(messages, "message-id"), message);
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
  public searchResults: Array<{name: string}> = [];

  async searchFriend(name: string) {
    if(name.trim() === "") {
      this.searchResults = [];
      return;
    }

    const userRef = collection(db, "users");
    const q = query(userRef, where("name", "==", name));
    
    const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

    this.searchResults = querySnapshot.docs.map(doc => ({
      name: doc.data()['name']
    }));
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