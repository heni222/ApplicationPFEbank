import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAnalysteComponent } from './dashboard-analyste.component';

describe('DashboardAnalysteComponent', () => {
  let component: DashboardAnalysteComponent;
  let fixture: ComponentFixture<DashboardAnalysteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAnalysteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardAnalysteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
