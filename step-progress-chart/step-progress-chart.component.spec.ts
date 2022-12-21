import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StepProgressChartComponent } from './step-progress-chart.component';

describe('StepProgressChartComponent', () => {
  let component: StepProgressChartComponent;
  let fixture: ComponentFixture<StepProgressChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StepProgressChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StepProgressChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
