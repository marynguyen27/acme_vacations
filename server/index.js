const {
  client,
  createTables,
  createUser,
  createPlace,
  createVacation,
  fetchUsers,
  fetchPlaces,
  fetchVacations,
  destroyVacation,
} = require('./db');
const express = require('express');
const app = express();
app.use(express.json());

app.get('/api/users', async (req, res, next) => {
  try {
    res.send(await fetchUsers());
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/places', async (req, res, next) => {
  try {
    res.send(await fetchPlaces());
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/vacations', async (req, res, next) => {
  try {
    res.send(await fetchVacations());
  } catch (ex) {
    next(ex);
  }
});

app.delete('/api/users/:user_id/vacations/:id', async (req, res, next) => {
  try {
    await destroyVacation({ user_id: req.params.user_id, id: req.params.id });
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

app.post('/api/users/:user_id/vacations', async (req, res, next) => {
  try {
    res.status(201).send(
      await createVacation({
        user_id: req.params.user_id,
        place_id: req.body.place_id,
        departure_date: req.body.departure_date,
      })
    );
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message || err });
});
const init = async () => {
  console.log('connecting to database');
  await client.connect();
  console.log('connected to database');
  await createTables();
  console.log('created tables');
  const [moe, lucy, larry, ethyl, paris, london, nyc] = await Promise.all([
    createUser({ name: 'moe' }),
    createUser({ name: 'lucy' }),
    createUser({ name: 'larry' }),
    createUser({ name: 'ethyl' }),
    createPlace({ name: 'paris' }),
    createPlace({ name: 'london' }),
    createPlace({ name: 'nyc' }),
  ]);
  console.log(await fetchUsers());
  console.log(await fetchPlaces());

  const [vacation, vacation2] = await Promise.all([
    createVacation({
      user_id: moe.id,
      place_id: nyc.id,
      departure_date: '02/14/2024',
    }),
    createVacation({
      user_id: moe.id,
      place_id: nyc.id,
      departure_date: '02/28/2024',
    }),
  ]);
  console.log(await fetchVacations());
  await destroyVacation({ id: vacation.id, user_id: vacation.user_id });
  console.log(await fetchVacations());

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
    console.log('some curl commands to test');
    console.log(`curl localhost:${port}/api/users`);
    console.log(`curl localhost:${port}/api/places`);
    console.log(`curl localhost:${port}/api/vacations`);
    console.log(
      `curl -X DELETE localhost:${port}/api/users/${moe.id}/vacations/${vacation2.id}`
    );
    console.log(
      `curl -X POST localhost:${port}/api/users/${moe.id}/vacations/ -d '{"place_id":"${london.id}", "departure_date": "02/15/2025"}' -H "Content-Type:application/json"`
    );
  });
};

init();
