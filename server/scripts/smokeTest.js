// ==============================================================================
// APEX PERFORMANCE — END-TO-END API SMOKE TEST
// File Path: server/scripts/smokeTest.js
//
// Usage (run from the server folder):
//   node scripts/smokeTest.js
//   node scripts/smokeTest.js --with-ai
//   node scripts/smokeTest.js --base=https://your-api.onrender.com/api
//
// Creates two throwaway users (smoke-...@example.com) and one booking per run.
// Remove leftovers with scripts/cleanupTestData.js. Exit code 1 means a check failed.
// ==============================================================================

const args = process.argv.slice(2);
const baseArg = args.find((arg) => arg.startsWith('--base='));
const BASE = (baseArg ? baseArg.slice('--base='.length) : process.env.SMOKE_BASE_URL || 'http://localhost:5000/api').replace(
  /\/+$/,
  ''
);
const WITH_AI = args.includes('--with-ai');
const IS_LOCAL = /\/\/(localhost|127\.0\.0\.1)/.test(BASE);
const PASSWORD = 'SmokePass123!';
const TIMEOUT_MS = 45000;

let passed = 0;
let failed = 0;
let warned = 0;

const check = (name, ok, detail = '') => {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
};

const warn = (name, detail = '') => {
  warned += 1;
  console.log(`  WARN  ${name}${detail ? ` -> ${detail}` : ''}`);
};

const section = (title) => console.log(`\n${title}`);

const call = async (method, path, { body, raw, token } = {}) => {
  const headers = { Accept: 'application/json' };
  const payload = raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined;
  if (payload !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: payload,
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    return { status: response.status, data, headers: response.headers };
  } catch (error) {
    return { status: 0, data: null, headers: new Headers(), error: error.message };
  }
};

// A start time far in the future, varied per run so repeated runs rarely collide
const futureStart = (days, seed) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(8 + (seed % 10), (seed * 7) % 60, 0, 0);
  return date.toISOString();
};

const main = async () => {
  console.log(`Smoke test against ${BASE}`);
  console.log(`AI check: ${WITH_AI ? 'ON' : 'off (use --with-ai to include it)'}`);

  const seed = Math.floor(Math.random() * 1000);
  const emailA = `smoke-a-${Date.now()}-${seed}@example.com`;
  const emailB = `smoke-b-${Date.now()}-${seed}@example.com`;

  // ---------- 1. Platform ----------
  section('1. Platform health and headers');
  const health = await call('GET', '/health');
  check('health returns 200', health.status === 200, `status ${health.status} ${health.error || ''}`);
  if (health.status === 0) {
    console.log('\nCannot reach the API. Is the server running, and is the --base URL correct?');
    return;
  }
  check('database reports connected', health.data?.database?.connected === true);
  check('health does not reveal database host or name', health.data?.database?.host === undefined && health.data?.database?.name === undefined);
  check('x-content-type-options header present', health.headers.get('x-content-type-options') === 'nosniff');
  check('x-powered-by header absent', !health.headers.get('x-powered-by'));

  // ---------- 2. Catalog ----------
  section('2. Service catalog');
  const catalog = await call('GET', '/services');
  const services = Array.isArray(catalog.data?.services) ? catalog.data.services : [];
  check('catalog returns active services', catalog.status === 200 && services.length > 0, `status ${catalog.status}, count ${services.length}`);
  if (services.length === 0) {
    console.log('\nNo services available, so the booking checks cannot run.');
    return;
  }
  const service = services[0];
  check('services have ids and are active', services.every((item) => item._id && item.isActive !== false));

  const detail = await call('GET', `/services/${service._id}`);
  check('single service loads', detail.status === 200 && detail.data?.service?._id === service._id);
  const badId = await call('GET', '/services/abc');
  check('malformed service id returns 400', badId.status === 400, `status ${badId.status}`);
  const badCategory = await call('GET', '/services?category=Nonsense');
  check('unknown category returns 400', badCategory.status === 400, `status ${badCategory.status}`);

  // ---------- 3. Authentication ----------
  section('3. Authentication');
  const registerA = await call('POST', '/auth/register', {
    body: { name: 'Smoke Tester A', email: emailA, password: PASSWORD, role: 'admin' }
  });
  check('register returns 201 with a token', registerA.status === 201 && Boolean(registerA.data?.token), `status ${registerA.status}`);
  check('role escalation ignored (role is client)', registerA.data?.user?.role === 'client', `role ${registerA.data?.user?.role}`);
  if (!registerA.data?.token) {
    console.log('\nRegistration failed, so the remaining checks cannot run. If status is 429, restart the server to reset limits.');
    return;
  }

  const duplicate = await call('POST', '/auth/register', {
    body: { name: 'Smoke Tester A', email: emailA, password: PASSWORD }
  });
  check('duplicate email returns 409', duplicate.status === 409, `status ${duplicate.status}`);

  const loginA = await call('POST', '/auth/login', { body: { email: emailA, password: PASSWORD } });
  check('login returns a token', loginA.status === 200 && Boolean(loginA.data?.token), `status ${loginA.status}`);
  const tokenA = loginA.data?.token || registerA.data.token;

  const wrongPassword = await call('POST', '/auth/login', { body: { email: emailA, password: 'WrongPass999' } });
  check('wrong password returns 401', wrongPassword.status === 401, `status ${wrongPassword.status}`);

  const injection = await call('POST', '/auth/login', { raw: '{"email":{"$gt":""},"password":{"$gt":""}}' });
  check('NoSQL operator login returns 401', injection.status === 401, `status ${injection.status}`);

  const me = await call('GET', '/auth/me', { token: tokenA });
  check('profile loads with a valid token', me.status === 200 && me.data?.user?.email === emailA);
  check('profile never exposes a password hash', !JSON.stringify(me.data || {}).toLowerCase().includes('passwordhash'));
  const meNoToken = await call('GET', '/auth/me');
  check('profile without a token returns 401', meNoToken.status === 401, `status ${meNoToken.status}`);

  const registerB = await call('POST', '/auth/register', {
    body: { name: 'Smoke Tester B', email: emailB, password: PASSWORD }
  });
  const tokenB = registerB.data?.token;
  check('second user registers', registerB.status === 201 && Boolean(tokenB), `status ${registerB.status}`);

  // ---------- 4. Booking lifecycle ----------
  section('4. Booking lifecycle');
  const days = 400 + (seed % 300);
  const startTime = futureStart(days, seed);
  const newStartTime = futureStart(days + 1, seed + 1);

  const created = await call('POST', '/bookings', {
    token: tokenA,
    body: { serviceId: service._id, startTime, notes: 'Smoke test', status: 'completed', priceAtBooking: 0 }
  });
  const booking = created.data?.booking;
  check('booking is created (201)', created.status === 201 && Boolean(booking?._id), `status ${created.status} ${created.data?.message || ''}`);
  check('server sets status confirmed (client value ignored)', booking?.status === 'confirmed', `status ${booking?.status}`);
  check('server sets price from the catalog (client value ignored)', booking?.priceAtBooking === service.price, `price ${booking?.priceAtBooking}`);
  if (!booking?._id) {
    console.log('\nBooking creation failed, so the remaining booking checks cannot run.');
    return;
  }

  const conflict = await call('POST', '/bookings', { token: tokenA, body: { serviceId: service._id, startTime } });
  check('same service and time is rejected (409)', conflict.status === 409, `status ${conflict.status}`);

  const injectedBooking = await call('POST', '/bookings', {
    token: tokenA,
    raw: `{"serviceId":{"$ne":null},"startTime":"${startTime}"}`
  });
  check('operator object as serviceId is rejected (400)', injectedBooking.status === 400, `status ${injectedBooking.status}`);

  const pastBooking = await call('POST', '/bookings', {
    token: tokenA,
    body: { serviceId: service._id, startTime: '2020-01-01T10:00:00.000Z' }
  });
  check('past start time is rejected (400)', pastBooking.status === 400, `status ${pastBooking.status}`);

  const noAuthBooking = await call('POST', '/bookings', { body: { serviceId: service._id, startTime } });
  check('booking without a token is rejected (401)', noAuthBooking.status === 401, `status ${noAuthBooking.status}`);

  const mine = await call('GET', '/bookings/mine', { token: tokenA });
  check('booking appears in my bookings', mine.status === 200 && (mine.data?.bookings || []).some((item) => item._id === booking._id));

  const mineB = await call('GET', '/bookings/mine', { token: tokenB });
  check("another user's list does not contain it", mineB.status === 200 && !(mineB.data?.bookings || []).some((item) => item._id === booking._id));

  const rescheduled = await call('PATCH', `/bookings/${booking._id}`, { token: tokenA, body: { startTime: newStartTime } });
  check(
    'reschedule succeeds and moves the booking',
    rescheduled.status === 200 && new Date(rescheduled.data?.booking?.startTime).toISOString() === newStartTime,
    `status ${rescheduled.status}`
  );

  const foreignCancel = await call('DELETE', `/bookings/${booking._id}`, { token: tokenB });
  check("another user cannot cancel it (403)", foreignCancel.status === 403, `status ${foreignCancel.status}`);

  const foreignEdit = await call('PATCH', `/bookings/${booking._id}`, { token: tokenB, body: { notes: 'hijacked' } });
  check("another user cannot edit it (403)", foreignEdit.status === 403, `status ${foreignEdit.status}`);

  const cancelled = await call('DELETE', `/bookings/${booking._id}`, { token: tokenA });
  check('owner cancels the booking', cancelled.status === 200 && cancelled.data?.booking?.status === 'cancelled', `status ${cancelled.status}`);

  const cancelAgain = await call('DELETE', `/bookings/${booking._id}`, { token: tokenA });
  check('cancelling twice is rejected (400)', cancelAgain.status === 400, `status ${cancelAgain.status}`);

  const editCancelled = await call('PATCH', `/bookings/${booking._id}`, { token: tokenA, body: { startTime: newStartTime } });
  check('editing a cancelled booking is rejected (400)', editCancelled.status === 400, `status ${editCancelled.status}`);

  const mineAfter = await call('GET', '/bookings/mine', { token: tokenA });
  const kept = (mineAfter.data?.bookings || []).find((item) => item._id === booking._id);
  check('cancelled booking stays in history', kept?.status === 'cancelled');

  // ---------- 5. Error handling ----------
  section('5. Error handling');
  const unknownRoute = await call('GET', '/does-not-exist');
  check('unknown route returns a JSON 404', unknownRoute.status === 404 && unknownRoute.data?.status === 'error');

  const malformed = await call('POST', '/auth/login', { raw: '{bad json' });
  check('malformed JSON returns 400', malformed.status === 400, `status ${malformed.status}`);
  check('malformed JSON message hides parser details', malformed.data?.message === 'Malformed JSON in request body', `message ${malformed.data?.message}`);

  if (malformed.data && 'stack' in malformed.data) {
    if (IS_LOCAL) {
      warn('error responses include a stack trace', 'expected in development mode; must not happen on the deployed server');
    } else {
      check('error responses never include a stack trace', false, 'stack field present');
    }
  } else {
    check('error responses never include a stack trace', true);
  }

  // ---------- 6. AI (optional) ----------
  if (WITH_AI) {
    section('6. AI recommendations (uses AI quota)');
    const ai = await call('POST', '/ai/recommend-service', {
      body: { message: 'I want to build strength and loosen up tight hips.' }
    });

    if ([502, 503, 504].includes(ai.status)) {
      check('AI outage returns a safe fallback hint', ai.data?.fallback?.path === '/services', `status ${ai.status}`);
      warn('AI provider unavailable right now', `status ${ai.status}; retry later`);
    } else {
      check('AI endpoint returns 200', ai.status === 200, `status ${ai.status}`);
      const recommendations = Array.isArray(ai.data?.recommendations) ? ai.data.recommendations : [];
      const realIds = new Set(services.map((item) => String(item._id)));
      check(
        'every recommended service exists in the catalog',
        recommendations.every((item) => realIds.has(String(item.service?.id))),
        'a recommendation did not match a real service'
      );
      check('response includes a disclaimer', typeof ai.data?.disclaimer === 'string' && ai.data.disclaimer.length > 0);
    }

    const aiInjection = await call('POST', '/ai/recommend-service', { raw: '{"message":{"$ne":null}}' });
    check('AI endpoint rejects a non-text message (400)', aiInjection.status === 400, `status ${aiInjection.status}`);
  }

  console.log('\nNote: this run created two smoke-...@example.com users in the database.');
};

main()
  .catch((error) => {
    failed += 1;
    console.error(`\nSmoke test crashed: ${error.message}`);
  })
  .finally(() => {
    console.log(`\nResult: ${passed} passed, ${failed} failed, ${warned} warnings`);
    process.exitCode = failed > 0 ? 1 : 0;
  });