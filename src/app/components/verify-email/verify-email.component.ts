import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../..//services/auth/auth.service';


@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})

export class VerifyEmailComponent implements OnInit {
  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {}

  redirectToSignIn() {
    this.router.navigate(['/sign-in'])
  }
}
