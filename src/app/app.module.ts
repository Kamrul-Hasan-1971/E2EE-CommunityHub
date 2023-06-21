import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserModule } from '@angular/platform-browser';
// import { IMqttServiceOptions, MqttModule } from 'ngx-mqtt';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireStorageModule } from '@angular/fire/compat/storage';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { MaterialModule } from './shared/module/material.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// component
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { MainContainerComponent } from './components/main-container/main-container.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { SidebarContentComponent } from './components/sidebar-content/sidebar-content.component';
import { ChatDefaultPageComponent } from './components/chat-default-page/chat-default-page.component';
import { ChatAreaComponent } from './components/chat-area/chat-area.component';
import { ChatRoomComponent } from './components/chat-room/chat-room.component';

import { AuthService } from './services/auth/auth.service';

// import { initializeApp,provideFirebaseApp } from '@angular/fire/app';
import { environment as env } from '../environments/environment';
import { LoaderComponent } from './components/loader/loader.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MessageStatusModalComponent } from './components/modals/message-status-modal/message-status-modal.component';
import { MatDialogModule } from '@angular/material/dialog';

// import { provideAuth,getAuth } from '@angular/fire/auth';
// export const MQTT_SERVICE_OPTIONS: IMqttServiceOptions = {
//   hostname: env.mqtt.hostname,
//   clean: env.mqtt.clean,
//   port: env.mqtt.port,
//   path: env.mqtt.path,
//   protocol: (env.mqtt.protocol === "wss") ? "wss" : "ws",
//   username: env.mqtt.username,
//   password: env.mqtt.password,
//   connectOnCreate: env.mqtt.connectOnCreate
// };
@NgModule({
  declarations: [
    AppComponent,
    MainContainerComponent,
    SidebarComponent,
    SidebarContentComponent,
    ChatAreaComponent,
    ChatDefaultPageComponent,
    ChatRoomComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    VerifyEmailComponent,
    LoaderComponent,
    MessageStatusModalComponent,
    // LoginComponent,
    // RegisterComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    RouterModule,
    // MqttModule.forRoot(MQTT_SERVICE_OPTIONS),
    FlexLayoutModule,
    BrowserModule,
    ReactiveFormsModule,
    AngularFireModule.initializeApp(env.firebase),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    AngularFireDatabaseModule,
    HttpClientModule,
    MatDialogModule,
    // provideFirebaseApp(() => initializeApp(env.firebase)),
    // provideAuth(() => getAuth())
  ],
  providers: [AuthService],
  bootstrap: [AppComponent],
})
export class AppModule {}
