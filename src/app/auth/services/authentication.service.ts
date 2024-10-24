import { Injectable } from '@angular/core';
import { app, auth } from '../../../environments/environment.dev';
import { 
    GoogleAuthProvider, GithubAuthProvider, 
    onAuthStateChanged, signInWithPopup, 
    signOut, User, createUserWithEmailAndPassword, 
    updateProfile} from 'firebase/auth';

import { BehaviorSubject, from, Observable } from 'rxjs';
import { UserModel } from '../../../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  private googleProvider = new GoogleAuthProvider();

  public currentUser = new BehaviorSubject<User | null>(null);

  constructor() {
    //To store info about the current user
    //If the user is logged in, the currentUser will be updated with the user object

    //And if the page will be refreshed, the user will still be logged in
    onAuthStateChanged(auth, (user) => {
      user ? this.currentUser.next(user) : this.currentUser.next(null);  
    })
  };

  logInGoogle(): Observable<any> {
    return from(signInWithPopup(auth, this.googleProvider));
  }

  logInEmailPassword(email: string, password: string, name: string): Observable<any> {
    return from(createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              //Changes the user's display name
              const user = userCredential.user;
              
              return updateProfile(user, {displayName: name}).then(() => {
                this.currentUser.next(user);

                return user;
              });
            }));
  }

  logOut(): Observable<any> {
    this.currentUser = new BehaviorSubject<User | null>(null);

    return from(signOut(auth));
  }
}