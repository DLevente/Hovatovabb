const request = require('supertest');

jest.mock('../fetchClient', () => {
    return {
        fetchFn: jest.fn(),
    };
});

const { fetchFn } = require('../fetchClient');
const app = require('../server'); // server.js exportálja az app-ot

describe('Menetrend API', () => {
    beforeEach(() => {
        fetchFn.mockReset();
    });

    test('POST /api/searchRoutesCustom -> visszaadja a találatokat', async () => {
        const mockedResponse = {
            status: 'success',
            results: {
                talalatok: {
                    '1': { nativeData: [{ RunId: 111 }] },
                    '2': { nativeData: [{ RunId: 222 }] },
                },
            },
        };

        fetchFn.mockResolvedValue({
            json: async () => mockedResponse,
        });

        const payload = {
            from: { name: 'Mátészalka', settlementId: 1, ls_id: 12978, siteCode: 0 },
            to: { name: 'Nyíregyháza', settlementId: 2, ls_id: 12638, siteCode: 0 },
            date: '2026-01-28',
            hour: 7,
            minute: 30,
            allowTransfers: true,
        };

        const res = await request(app)
            .post('/api/searchRoutesCustom')
            .send(payload)
            .set('Content-Type', 'application/json');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockedResponse);

        expect(fetchFn).toHaveBeenCalledTimes(1);

        const [url, options] = fetchFn.mock.calls[0];
        expect(String(url)).toContain('menetrendek.hu/menetrend/newinterface/index.php');

        const sent = JSON.parse(options.body);
        expect(sent.func).toBe('getRoutes');
        // dátum átadása (ha a te endpointod így építi fel)
        expect(sent.params.datum).toBe(payload.date);
    });
});