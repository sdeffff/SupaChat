import { Injectable } from '@angular/core';
import { app, auth } from '../../../environments/environment.dev';
import { 
    GoogleAuthProvider, GithubAuthProvider, 
    onAuthStateChanged, signInWithPopup, 
    signOut, User, createUserWithEmailAndPassword } from 'firebase/auth';

import { BehaviorSubject, from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private googleProvider = new GoogleAuthProvider()
          gitHubProvider = new GithubAuthProvider();


  public currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    //To store info about the current user
    //If the user is logged in, the currentUser will be updated with the user object

    //And if the page will be refreshed, the user will still be logged in
    onAuthStateChanged(auth, (user) => {
        if(user) this.currentUser.next(user);
        else this.currentUser.next(null);
    })
  };

  logInGoogle(): Observable<any> {
    return from(signInWithPopup(auth, this.googleProvider));
  }

  logInEmailPassword(email: string, password: string): Observable<any> {
    return from(createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                this.currentUser.next(userCredential.user);
            }));
  }

  logOut(): Observable<any> {
    this.currentUser = new BehaviorSubject<User | null>(null);

    return from(signOut(auth));
  }
}