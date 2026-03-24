import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCreditComponent } from './dashboard-credit.component';

describe('DashboardCreditComponent', () => {
  let component: DashboardCreditComponent;
  let fixture: ComponentFixture<DashboardCreditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCreditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCreditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
