import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageStatusModalComponent } from './message-status-modal.component';

describe('MessageStatusModalComponent', () => {
  let component: MessageStatusModalComponent;
  let fixture: ComponentFixture<MessageStatusModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MessageStatusModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MessageStatusModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
