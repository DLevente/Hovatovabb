const request = require('supertest');

jest.mock('../db');
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const db = require('../db');
const bcrypt = require('bcrypt');
const app = require('../server');

describe('POST /api/login', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('sikeres bejelentkezés', async () => {
    // db.query
    db.query.mockResolvedValueOnce([
      [
        {
          felhasznalonev: 'tesztuser',
          jelszo: '$2b$10$FAKEHASH', // hash (kamu)
          email: 'teszt@mail.hu',
          teljes_nev: 'Teszt Jancsi',
          kedv_id: 3
        }
      ],
      []
    ]);

    // bcrypt compare
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/login')
      .send({ felhasznalonev: 'tesztuser', jelszo: 'tesztjelszo' });
  });
});