// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  firebase: {
    apiKey: "AIzaSyBvF_Idhlo-1LtQWxm9Btc3EjikcTDWH4g",
    authDomain: "e2ee-communityhub.firebaseapp.com",
    databaseURL: "https://e2ee-communityhub-default-rtdb.firebaseio.com",
    projectId: "e2ee-communityhub",
    storageBucket: "e2ee-communityhub.appspot.com",
    messagingSenderId: "1013403778546",
    appId: "1:1013403778546:web:2baa2b83ac2419bbb77f6b",
    measurementId: "G-BSQBBYMWXT"
  },
  mqtt: {
    host: '76743a34cf5148e7a72ff85459154e5a.s1.eu.hivemq.cloud',
    //clean: false,
    port: 8884,
    path: '/mqtt',
    protocol: "wss",
    username: 'Kamrul71',
    password: 'Hasan730025',
    //connectOnCreate: false
  },
  production: false
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
