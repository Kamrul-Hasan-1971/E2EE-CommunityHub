import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PouchDbService } from 'src/app/services/clientDB/pouch-db.service';
import { MqttConnectorService } from 'src/app/services/mqtt/mqtt-connector.service';
import { SignalManagerService } from 'src/app/services/signal/signal-manager.service';
import { Utility } from 'src/app/utility/utility';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/users/user.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})

export class SignInComponent implements OnInit {

  //form
  loginForm: FormGroup;

  //variable
  returnUrl: string;
  loading = false;
  submitted = false;
  emailErrorMessage = "";


  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private signalManagerService: SignalManagerService,
    private mqttConnectorService: MqttConnectorService,
    private pouchDbService: PouchDbService
  ) { }

  ngOnInit() {
    this.initSignInForm();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  initSignInForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  updateEmailErrorMessage() {
    if (this.loginForm.controls['email']['errors']['required']) {
      this.emailErrorMessage = 'Email is required';
    }
    else if (this.loginForm.controls['email']['errors']['email']) {
      this.emailErrorMessage = 'Email is invalid';
    }
  }

  updateSignUpFormErrorMessage() {
    this.updateEmailErrorMessage();
  }

  async initiateAfterSignIn() {
    let currentAuthUser = await this.authService.getCurrentAuthUser()
      .catch(error => {
        window.alert(error);
        console.error(error);
        this.loading = false;
        return
      });

    let currentUser: any = await this.userService.getCurrentUser(currentAuthUser.uid)
      .catch(error => {
        this.loading = false;
        window.alert(error);
        console.error(error);
        this.loading = false;
      });
    if (currentAuthUser.emailVerified && !currentUser.emailVerified) {
      currentUser.emailVerified = true;
      Utility.setCurrentUser(currentUser);
      await this.userService.updateUser(currentUser);
    }
    await this.pouchDbService.init();
    await this.signalManagerService.initializeAsync(Utility.getCurrentUserId());
    this.loading = false;
    this.loginForm.reset();
    this.router.navigate(['']);
  }

  async signIn() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      this.updateSignUpFormErrorMessage();
      return;
    }
    const user = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    }
    this.loading = true;
    this.authService.SignIn(user.email, user.password)
      .then(async (signInResponse) => {
        if (!signInResponse.user.emailVerified) {
          //await this.authService.SignOut();
          this.redirectToVerifyEmailAdress();
        }
        else {
          await this.initiateAfterSignIn();
        }
      })
      .catch(error => {
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          window.alert('Wrong password.');
        } else {
          window.alert(errorMessage);
        }
        console.error(error);
        this.loading = false;
        return
      })
  }

  redirectToSignUp() {
    this.router.navigate(['/sign-up'])
  }

  redirectToForgotPassword() {
    this.router.navigate(['/forgot-password'])
  }

  redirectToVerifyEmailAdress() {
    this.router.navigate(['/verify-email-address'])
  }
}
