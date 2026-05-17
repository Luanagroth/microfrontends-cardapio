const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

async function withServer(run) {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test('GET /api/health returns backend status', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: 'ok' });
  });
});

test('POST /api/reservations rejects payload with missing required fields', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Teste',
        telefone: '(11) 99999-0000'
      })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('PATCH /api/reservations/:id/status requires status field', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reservations/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('POST /api/orders rejects payload without table number', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 1, name: 'Item', price: 10, quantity: 1 }]
      })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('POST /api/orders rejects payload without items', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber: '01',
        items: []
      })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('PATCH /api/orders/:id/status requires status field', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('POST /api/curriculums rejects payload without required fields', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/curriculums`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Teste'
      })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('POST /api/curriculums requires PDF file when fields are present', async () => {
  await withServer(async (baseUrl) => {
    const formData = new FormData();
    formData.append('nome', 'Teste');
    formData.append('telefone', '(11) 99999-0000');
    formData.append('email', 'teste@example.com');
    formData.append('mensagem', 'Mensagem');

    const response = await fetch(`${baseUrl}/api/curriculums`, {
      method: 'POST',
      body: formData
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('PATCH /api/curriculums/:id/status requires valid status value', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/curriculums/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('PATCH /api/reservations/:id/status rejects invalid status value', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reservations/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INVALIDO' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('PATCH /api/orders/:id/status rejects invalid status value', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/orders/1/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'INVALIDO' })
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(typeof body.error, 'string');
  });
});

test('POST /api/reservations creates a reservation with valid payload', async () => {
  await withServer(async (baseUrl) => {
    const unique = Date.now();
    const payload = {
      nome: `Reserva Teste ${unique}`,
      telefone: '(11) 98888-0000',
      email: `reserva-${unique}@example.com`,
      date: '2026-05-20T19:30:00.000Z',
      pessoas: 3,
      observacao: 'Mesa interna'
    };

    const response = await fetch(`${baseUrl}/api/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.nome, payload.nome);
    assert.equal(body.telefone, payload.telefone);
    assert.equal(body.email, payload.email);
    assert.equal(body.pessoas, payload.pessoas);
    assert.equal(body.status, 'PENDENTE');
    assert.equal(typeof body.id, 'number');
  });
});

test('POST /api/orders creates order and calculates totals from items', async () => {
  await withServer(async (baseUrl) => {
    const payload = {
      tableNumber: '12',
      customerName: 'Cliente Teste',
      items: [
        { productId: 101, name: 'Prato 1', price: 25.5, quantity: 2 },
        { productId: 202, name: 'Prato 2', price: 10, quantity: 1 }
      ],
      discount: 5
    };

    const response = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.tableNumber, payload.tableNumber);
    assert.equal(body.customerName, payload.customerName);
    assert.equal(body.status, 'aberta');
    assert.equal(Array.isArray(body.items), true);
    assert.equal(body.items.length, 2);
    assert.equal(body.total, 56);
    assert.equal(body.details.subtotal, 61);
    assert.equal(body.details.discount, 5);
  });
});

test('POST /api/curriculums creates curriculum with PDF upload', async () => {
  await withServer(async (baseUrl) => {
    const unique = Date.now();
    const formData = new FormData();
    formData.append('nome', `Curriculo Teste ${unique}`);
    formData.append('telefone', '(11) 97777-0000');
    formData.append('email', `curriculo-${unique}@example.com`);
    formData.append('mensagem', 'Disponivel para entrevista');
    formData.append(
      'arquivo',
      new Blob(['%PDF-1.4\n% test pdf content'], { type: 'application/pdf' }),
      'curriculo-teste.pdf'
    );

    const response = await fetch(`${baseUrl}/api/curriculums`, {
      method: 'POST',
      body: formData
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.nome, `Curriculo Teste ${unique}`);
    assert.equal(body.email, `curriculo-${unique}@example.com`);
    assert.equal(body.mimeType, 'application/pdf');
    assert.equal(body.status, 'NOVO');
    assert.equal(typeof body.fileUrl, 'string');
    assert.equal(body.fileUrl.includes('/uploads/curriculums/'), true);
  });
});
