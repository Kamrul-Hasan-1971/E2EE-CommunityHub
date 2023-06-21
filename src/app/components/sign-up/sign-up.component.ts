import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/users/user.service';
import * as uuid from 'uuid';
import { User } from '../../models/user';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})

export class SignUpComponent implements OnInit {

  registerForm: FormGroup;
  loading = false;
  submitted = false;
  emailErrorMessage: string;

  constructor(
    public authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
    private userService: UserService
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.registerForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  updateEmailErrorMessage() {
    if (this.registerForm.controls['email']['errors']['required']) {
      this.emailErrorMessage = 'Email is required';
    }
    else if (this.registerForm.controls['email']['errors']['email']) {
      this.emailErrorMessage = 'Email is invalid';
    }
  }

  updateSignUpFormErrorMessage() {
    this.updateEmailErrorMessage();
  }

  signUp() {
    this.submitted = true;
    this.emailErrorMessage = '';
    if (this.registerForm.invalid) {
      this.updateSignUpFormErrorMessage();
      return;
    }
    this.loading = true;
    const newUser = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
    }
    this.authService.SignUp(newUser.email, newUser.password)
      .then(res => {
        return res;
      })
      .then((res) => {
        return this.userService.addUser(new User(res.user.uid, newUser.email, newUser.name, false));
      })
      .then(() => {
        return this.authService.SendVerificationMail();
      })
      .then((res) => {
        this.loading = false;
        this.redirectToVerifyEmailAdress();
      })
      .catch(err => {
        this.loading = false;
        window.alert(err.message);
        console.error("SignUpComponent:: Signup error: ", err);
      });
  }

  redirectToSignIn() {
    this.router.navigate(['/sign-in'])
  }

  redirectToVerifyEmailAdress() {
    this.router.navigate(['/verify-email-address'])
  }
}
