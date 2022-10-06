import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private loading: number = 0;

  constructor() { }

  setLoading(loading: boolean) {
    if(loading){
      this.loading++;
    }
    else{
      this.loading--;
    }
  }

  getLoading(): boolean {
    if(this.loading > 0) return true;
    return false;
  }
}
