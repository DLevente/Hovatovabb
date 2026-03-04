import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { SearchComponent } from './search.component';
import { SearchService } from '../../services/search.service';

fdescribe('Integrációs teszt: SearchComponent -> SearchService => HttpClient', () => {
  let fixture: ComponentFixture<SearchComponent>;
  let component: SearchComponent;
  let httpMock: HttpTestingController;
  let searchService: SearchService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchComponent],
      imports: [FormsModule, HttpClientTestingModule],
      providers: [SearchService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    searchService = TestBed.inject(SearchService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  fit('onSearch(): elküldi a keresést, majd a válaszból feltölti a journeys tömböt', () => {
    // beállítjuk a keresési inputokat (ugyanúgy, ahogy a felhasználó tenné)
    component.from = { lsname: 'A', settlement_id: 1, ls_id: 11, site_code: 0 };
    component.to = { lsname: 'B', settlement_id: 2, ls_id: 22, site_code: 0 };
    component.selectedDate = '2026-01-27';
    component.selectedTime = '10:15';

    (component as any).allowTransfers = true;

    component.onSearch();

    // onSearch azonnal loadingra kapcsol
    expect(component.loading).toBeTrue();

    // 1) elkapjuk a SearchService által küldött HTTP hívást
    const req = httpMock.expectOne((r) =>
      r.method === 'POST' && r.url.includes('/searchRoutesCustom')
    );

    // 2) ellenőrizzük a request body-t (a te service-edet tükrözze)
    expect(req.request.body.from.name).toBe('A');
    expect(req.request.body.to.name).toBe('B');
    expect(req.request.body.date).toBe('2026-01-27');
    expect(req.request.body.hour).toBe(10);

    const sentMinute = req.request.body.min ?? req.request.body.minute ?? req.request.body.minutes;
    expect(sentMinute).toBe(15);

    // 3) visszaadunk egy “backend” választ a service-nek
    req.flush({
      results: {
        talalatok: {
          "0": { nativeData: [{ DepartureTime: 600, ArrivalTime: 660, RunId: 1 }] },
          "1": { nativeData: [{ DepartureTime: 700, ArrivalTime: 800, RunId: 2 }] }
        }
      }
    });

    // 4) a componentnek most már le kell állítania a loadert és be kell töltenie a találatokat
    expect(component.loading).toBeFalse();
    expect(component.journeys.length).toBe(2);
    expect(component.journeys[0].nativeData[0].RunId).toBe(1);
  });
});
