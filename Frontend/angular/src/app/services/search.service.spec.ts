import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SearchService } from './search.service';

fdescribe('SearchService', () => {
  let service: SearchService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SearchService],
    });

    service = TestBed.inject(SearchService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  fit('searchRoutesCustom: POST-ol és visszaad egy tömböt a backend válaszból', () => {
    const from = { lsname: 'A', settlement_id: 1, ls_id: 11, site_code: 0 };
    const to   = { lsname: 'B', settlement_id: 2, ls_id: 22, site_code: 0 };

    const mockBackendResponse = {
      results: {
        talalatok: {
          "0": { nativeData: [{ RunId: 1 }] },
          "1": { nativeData: [{ RunId: 2 }] }
        }
      }
    };

    service.searchRoutesCustom(from, to, '2026-01-27', 10, 15).subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
      expect(res.length).toBe(2);
      expect(res[0].nativeData[0].RunId).toBe(1);
      expect(res[1].nativeData[0].RunId).toBe(2);
    });

    const req = httpMock.expectOne(`${service.baseUrl}/searchRoutesCustom`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.from.name).toBe('A');
    expect(req.request.body.to.name).toBe('B');
    expect(req.request.body.date).toBe('2026-01-27');
    expect(req.request.body.hour).toBe(10);

    const sentMinute = req.request.body.min ?? req.request.body.minute ?? req.request.body.minutes;
    expect(sentMinute).toBe(15);

    req.flush(mockBackendResponse);
  });
});
