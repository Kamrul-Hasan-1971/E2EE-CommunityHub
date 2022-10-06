import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';


@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})

export class ForgotPasswordComponent implements OnInit {

  forgetPassowrdForm: FormGroup;
  submitted = false;
  emailErrorMessage = "";
  loading = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.initForgetPasswordForm();
  }

  initForgetPasswordForm() {
    this.forgetPassowrdForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  updateEmailErrorMessage() {
    if (this.forgetPassowrdForm.controls['email']['errors']['required']) {
      this.emailErrorMessage = 'Email is required';
    }
    else if (this.forgetPassowrdForm.controls['email']['errors']['email']) {
      this.emailErrorMessage = 'Email is invalid';
    }
  }

  updateForgetPasswordFormErrorMessage() {
    this.updateEmailErrorMessage();
  }

  forgetPassoword() {
    this.submitted = true;
    if (this.forgetPassowrdForm.invalid) {
      this.updateForgetPasswordFormErrorMessage();
      return;
    }
    const passwordResetEmail = this.forgetPassowrdForm.value.email;
    this.authService.ForgotPassword(passwordResetEmail)
      .then((res) => {
        this.loading = false;
        window.alert('Password reset email sent, check your inbox.');
      })
      .catch((err) => {
        this.loading = false;
        this.submitted = false;
        window.alert(err);
      })
  }
  redirectToSignIn() {
    this.router.navigate(['/sign-in'])
  }
}
