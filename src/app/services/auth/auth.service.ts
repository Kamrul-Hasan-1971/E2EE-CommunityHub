import { Injectable, NgZone } from '@angular/core';
import { User } from '../../models/user';
import * as auth from 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument,
} from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentAuthUser: any; // Save logged in user data

  constructor(
    public afs: AngularFirestore, // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,
    public ngZone: NgZone // NgZone service to remove outside scope warning
  ) {

    this.subscribeAuthState();
  }

  /* Saving user data in localstorage when
      logged in and setting up null when logged out */
  subscribeAuthState()
  {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.currentAuthUser = user;
        localStorage.setItem('currentAuthUser', JSON.stringify(this.currentAuthUser));
      } else {
        localStorage.setItem('currentAuthUser', 'null');
      }
    });
  }

  // Sign in with email/password
  SignIn(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        return result;
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  // Sign out
  SignOut() {
    return this.afAuth.signOut()
    .then(() => {
      localStorage.removeItem('user');
      localStorage.removeItem('currentAuthUser');
      this.router.navigate(['sign-in']);
      return {success: true}
    })
    .catch(err=>{
      console.error("Error when signout: ", err);
    })
  }

  // Sign up with email/password
  SignUp(email: string, password: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        //this.SignOut();
        return result;
        /* Call the SendVerificaitonMail() function when new user sign 
        up and returns promise */
        // this.SendVerificationMail();
        // this.SetUserData(result.user);
      })
      .catch((error) => {
      return Promise.reject(error);
        //window.alert(error.message);
      });
  }

  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('currentAuthUser'));
    return user !== null;
    //return user !== null && user.emailVerified !== false ? true : false;
  }

  getCurrentAuthUser() {
    return this.afAuth.currentUser
    .then(user =>{
      this.currentAuthUser = user;
      localStorage.setItem('currentAuthUser', JSON.stringify(this.currentAuthUser));
      return this.currentAuthUser;
    })
    .catch(err=> {
      return Promise.reject(err)
    });
  }

  // Send email verfificaiton when new user sign up
  SendVerificationMail() {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {
        this.router.navigate(['verify-email-address']);
      });
  }

  // Reset Forggot password
  ForgotPassword(passwordResetEmail: string) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then((res) => {
        return res;
      })
      .catch((error) => {
        window.alert(error);
      });
  }



  // Sign in with Google
  GoogleAuth() {
    return this.AuthLogin(new auth.GoogleAuthProvider())
    .then((res: any) => {
      this.router.navigate(['']);
    });
  }

  // Auth logic to run auth providers
  AuthLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        this.router.navigate(['']);

        this.SetUserData(result.user);
      })
      .catch((error) => {
        window.alert(error);
      });
  }

  /* Setting up user data when sign in with username/password, 
  sign up with username/password and sign in with social auth  
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user: any) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(
      `users/${user.uid}`
    );
    const userData= {
      uid: user.uid,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    };
    return userRef.set(userData, {
      merge: true,
    });
  }
}
