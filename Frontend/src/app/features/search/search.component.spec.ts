import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SearchComponent } from './search.component';
import { SearchService } from '../../services/search.service';

fdescribe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let searchSpy: jasmine.SpyObj<SearchService>;

  beforeEach(async () => {
    searchSpy = jasmine.createSpyObj<SearchService>('SearchService', [
      'searchRoutesCustom',
      'getDelayInfo',
      'runsDelay',
    ]);

    await TestBed.configureTestingModule({
      declarations: [SearchComponent],
      imports: [FormsModule],
      providers: [{ provide: SearchService, useValue: searchSpy }],
      schemas: [NO_ERRORS_SCHEMA], // ✅ ez kell az app-search-form miatt
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;

    component.from = { lsname: 'A', settlement_id: 1, ls_id: 11, site_code: 0 };
    component.to   = { lsname: 'B', settlement_id: 2, ls_id: 22, site_code: 0 };
    component.selectedDate = '2026-01-27';
    component.selectedTime = '10:15';

    // nálad így hívhatják: calcDelays / delayCalcEnabled / stb.
    (component as any).calcDelays = false;
  });

  fit('onSearch(): calcDelays=false esetén csak searchRoutesCustom fut, és journeys feltöltődik', () => {
    const mockJourneys = [
      { nativeData: [{ DepartureTime: 600, ArrivalTime: 660 }] },
      { nativeData: [{ DepartureTime: 700, ArrivalTime: 800 }] },
    ];

    searchSpy.searchRoutesCustom.and.returnValue(of(mockJourneys));
    searchSpy.getDelayInfo.and.returnValue(of({}));
    searchSpy.runsDelay.and.returnValue(of([]));

    component.onSearch();

    expect(searchSpy.searchRoutesCustom).toHaveBeenCalled();
    expect(component.journeys.length).toBe(2);

    // ✅ ne induljon késésszámítás
    expect(searchSpy.getDelayInfo).not.toHaveBeenCalled();
    expect(searchSpy.runsDelay).not.toHaveBeenCalled();
  });
});
