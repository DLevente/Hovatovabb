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

    test('POST /api/searchStation -> visszaadja az állomás találatokat', async () => {
        const mockedResponse = {
            status: 'success',
            results: {
                stations: [{ lsname: 'Budapest-Nyugati pu.', ls_id: 123 }],
            },
        };

        fetchFn.mockResolvedValue({
            json: async () => mockedResponse,
        });

        const res = await request(app)
            .post('/api/searchStation')
            .send({ query: 'Budapest' })
            .set('Content-Type', 'application/json');

        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual(mockedResponse);

        // ellenőrizzük, hogy a külső API hívás megtörtént
        expect(fetchFn).toHaveBeenCalledTimes(1);

        const [url, options] = fetchFn.mock.calls[0];
        expect(String(url)).toContain('menetrendek.hu/menetrend/newinterface/index.php');

        const sent = JSON.parse(options.body);
        expect(sent.func).toBe('getStationOrAddrByText');
        expect(sent.params.inputText).toBe('Budapest');
    });
});