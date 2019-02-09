const express = require('express');
const path = require('path');
const axios = require('axios');
const redis = require('redis');
const app = express();

const instance = axios.create({
  baseURL: 'https://pokeapi.co/api/v2/',
  timeout: 1000,
});

const PORT = process.env.PORT || 3000;

const client = redis.createClient();

client.on('connect', () => {
  console.log(`connected to redis`);
  console.log(client);
});
client.on('error', err => {
  console.log(`Error: ${err}`);
});

const getPokemon = ({
  path,
  res,
}) => {
  return instance.get(path)
  .then(resp => {
    const pokemonAbilities = resp.data;
    const value = JSON.stringify(pokemonAbilities);
    setInRedis({
      path,
      value,
    })
    return res.json(pokemonAbilities);
  })
  .catch(err => err.status);
}

const getFromRedis = ({
  path,
  res,
}) => {
  client.get(path, (err, value) => {
    if (err) console.log('error getFromRedis', err);
    if (value) {
      const json = JSON.parse(value);
      console.log('Pokemon abilities exist', json);
      return res.json(json);
    } else {
      console.log('Pokemon abilities dont exist')
      getPokemon({
        path,
        res,
      });
    }
  });
}

const setInRedis = ({
  path,
  value,
}) => {
  client.set(path, value, (err, reply) => {
    if (err) console.log(err);
    console.log('REPLY', reply);
  })
}

app.listen(PORT);

app.get('/pokemon/:name', (req, res) => {
  const path = req.path;
  console.log('PATH', path)
  getFromRedis({
    path,
    res,
  });
})

console.log(`Runing at port: ${PORT}`);