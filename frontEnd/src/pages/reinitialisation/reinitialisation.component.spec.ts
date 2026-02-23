import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReinitialisationComponent } from './reinitialisation.component';

describe('ReinitialisationComponent', () => {
  let component: ReinitialisationComponent;
  let fixture: ComponentFixture<ReinitialisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReinitialisationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReinitialisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
