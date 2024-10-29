import { Injectable } from '@angular/core';
import { auth, db } from '../../../environments/environment.dev';
import { 
    GoogleAuthProvider, 
    onAuthStateChanged, signInWithPopup, 
    signOut, User, createUserWithEmailAndPassword, signInWithEmailAndPassword,
    updateProfile, sendEmailVerification, deleteUser } from 'firebase/auth';

import { doc, setDoc } from 'firebase/firestore';

import { BehaviorSubject, from, Observable } from 'rxjs';

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
      if (user && user.emailVerified) {
        this.currentUser.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if(location.pathname === "/auth/login" || location.pathname === "/auth/register") {
          location.pathname = "/chatroom";
        }
      } else {
        this.currentUser.next(null);
        localStorage.removeItem('currentUser');
      }
    })
  };

  logInGoogle(): Observable<any> {
    return from(signInWithPopup(auth, this.googleProvider));
  }

  registerEmailPassword(email: string, password: string, name: string): Observable<any> {
    return from(createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
              //Send verification email
              sendEmailVerification(userCredential.user)
                .then(() => {
                  alert(`Verification email sent to your email address ${name}`);
                

              //Changes the user's display name
              const user = userCredential.user;

              return updateProfile(user, {displayName: name}).then(() => {
                this.currentUser.next(user);
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                setDoc(doc(db, "users", name), {
                  name: name,
                  email: email,
                  uid: user.uid,
                });

                return user;
              })
            });
            })
          )}

  logInEmailPassword(email: string, password: string): Observable<any> {
    return from(signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
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