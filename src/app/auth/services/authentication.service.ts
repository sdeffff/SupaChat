import { Injectable } from '@angular/core';
import { auth, db } from '../../../environments/environment.dev';
import { 
    GoogleAuthProvider, 
    onAuthStateChanged, signInWithPopup, 
    signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';

import { BehaviorSubject, from, Observable, firstValueFrom, map } from 'rxjs';
import { ref, set, get } from 'firebase/database';

import { ChatService } from '../../components/chat-components/services/chat-service.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private googleProvider = new GoogleAuthProvider();

  public currentUser = new BehaviorSubject<User | null>(null);

  constructor(private chatService: ChatService) {
    //To store info about the current user
    //If the user is logged in, the currentUser will be updated with the user object

    //And if the page will be refreshed, the user will still be logged in
    onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        this.currentUser.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));

        this.createUserChatroom();

        setTimeout(() => {
          if(location.pathname === "/auth/login" || location.pathname === "/auth/register") {
            location.pathname = "/chatroom";
          }
        }, 350);
      } else this.logOut();
    })
  };

  createUserChatroom():Observable<any> {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const userChatRef = ref(db, 'userchats/' + currentUser.uid);

    return from(get(userChatRef)).pipe(
      map((snapshot) => {
      if(snapshot.exists()) {
        return;
      } else {
        set(userChatRef, {
          chatrooms: [],
        });
      }
    }));
  }

  logInGoogle(): Observable<any> {
    return from(signInWithPopup(auth, this.googleProvider))
            .pipe(
              map((userCredential) => {
              const user = userCredential.user;

              this.currentUser.next(user);
              localStorage.setItem('currentUser', JSON.stringify(user));

              const userRef = ref(db, 'users/' + user.uid);

              return from((get(userRef))).pipe(
                map((snapshot) => {
                if(snapshot.exists()) {
                  return;
                } else {
                  set(userRef, {
                    name: user.displayName,
                    email: user.email,
                    uid: user.uid,
                    pfp: user.photoURL,
                    friends: [],
                  })
                  
                  return user;
                };
              }))
            }))
  }

  registerEmailPassword(email: string, password: string, name: string): Observable<any> {
    return from(createUserWithEmailAndPassword(auth, email, password)).pipe(
              map((userCredential) => {
              const user = userCredential.user;

              //Send verification email
              sendEmailVerification(user)
                .then(() => {
                  alert(`Verification email sent to your email address ${name}`);
                
                //Update user's name
                return updateProfile(user, { displayName: name })
                  .then(() => {
                    this.currentUser.next(user);
                    localStorage.setItem('currentUser', JSON.stringify(user));
      
                    //Write user data to the database
                    const userRef = ref(db, 'users/' + user.uid);        

                    updateProfile(user, {photoURL: `https://eu.ui-avatars.com/api/?name=${name.split(" ")[0]}&size=250%22`});

                    set(userRef, {
                      name: name,
                      email: email,
                      uid: user.uid,
                      pfp: `https://eu.ui-avatars.com/api/?name=${name.split(" ")[0]}&size=250%22`,
                      friends: [],
                    });

                    return user;
                  })
                  .catch((err) => {
                    console.log("Error updating profile: ", err);
                  });
                }).catch((err) => {
                  console.log("Error writing user data to Realtime Database: ", err);
                });
            }))};
          

  logInEmailPassword(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(auth, email, password))
            .pipe(
              map((userCredential) => {
              const user = userCredential.user;

              this.currentUser.next(user);
              localStorage.setItem('currentUser', JSON.stringify(user));

              return user;
            }));
  }

  logOut(): Observable<any> {
    this.currentUser = new BehaviorSubject<User | null>(null);
    localStorage.removeItem('currentUser');

    return from(signOut(auth));
  }
}