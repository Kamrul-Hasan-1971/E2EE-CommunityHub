import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MqttNonPerCommonTopic } from 'src/app/models/mqtt-non-persistent-topic-enum';
import { PouchDbService } from 'src/app/services/clientDB/pouch-db.service';
import { MqttConnectorService } from 'src/app/services/mqtt/mqtt-connector.service';
import { PayloadProcessorService } from 'src/app/services/payloadProcessor/payload-processor.service';
import { MqttUtility } from 'src/app/utility/mqtt-utility/mqtt-utility';
import { Utility } from 'src/app/utility/utility';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/users/user.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
  loginForm: FormGroup;
  returnUrl: string;
  loading = false;
  submitted = false;
  emailErrorMessage = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private userService: UserService,
    private mqttConnectorService: MqttConnectorService,
    private pouchDbService: PouchDbService,
    private payloadProcessorService: PayloadProcessorService
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['']);
    }
    this.initSignInForm();
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  initSignInForm() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  updateEmailErrorMessage() {
    if (this.loginForm.controls['email']['errors']['required']) {
      this.emailErrorMessage = 'Email is required';
    } else if (this.loginForm.controls['email']['errors']['email']) {
      this.emailErrorMessage = 'Email is invalid';
    }
  }

  updateSignUpFormErrorMessage() {
    this.updateEmailErrorMessage();
  }

  async initiateAfterSignIn() {
    let currentAuthUser = await this.authService
      .getCurrentAuthUser()
      .catch((error) => {
        window.alert(error);
        console.error(
          'SignInComponent:: -> initiateAfterSignIn -> error',
          error
        );
        this.loading = false;
        return;
      });

    let currentUser: any = await this.userService
      .getCurrentUser(currentAuthUser.uid)
      .catch((error) => {
        this.loading = false;
        window.alert(error);
        console.error(
          'SignInComponent:: -> initiateAfterSignIn -> error',
          error
        );
        this.loading = false;
      });
    if (currentAuthUser.emailVerified && !currentUser.emailVerified) {
      currentUser.emailVerified = true;
      let newUserCreatePublishTopic = MqttUtility.parseMqttTopic(
        MqttNonPerCommonTopic.userCreate,
        Utility.getCommonTopicId()
      );
      console.log(
        'SignInComponent:: Publishing new user create in toopic',
        newUserCreatePublishTopic,
        'currentUser payload',
        currentUser
      );
      this.mqttConnectorService.publishToNonPersistentClient(
        newUserCreatePublishTopic,
        currentUser
      );

      Utility.setCurrentUser(currentUser);
      await this.userService.updateUser(currentUser);
    }
    await this.pouchDbService.init();
    this.payloadProcessorService.payloadProcessorServiceInit();
    this.mqttConnectorService.mqttConnectorServiceInit();
    this.loading = false;
    this.loginForm.reset();
    this.userService.redirectFromLoggedIn = true;
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
    };
    this.loading = true;
    this.authService
      .SignIn(user.email, user.password)
      .then(async (signInResponse) => {
        if (!signInResponse.user.emailVerified) {
          this.redirectToVerifyEmailAdress();
        } else {
          await this.initiateAfterSignIn();
        }
      })
      .catch((error) => {
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          window.alert('Wrong password.');
        } else {
          window.alert(errorMessage);
        }
        console.error('SignInComponent:: -> signIn -> error', error);
        this.loading = false;
        return;
      });
  }

  redirectToSignUp() {
    this.router.navigate(['/sign-up']);
  }

  redirectToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  redirectToVerifyEmailAdress() {
    this.router.navigate(['/verify-email-address']);
  }
}
