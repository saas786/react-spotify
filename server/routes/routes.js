import express from 'express';
import request from 'request';
import querystring from 'querystring';
const stateKey = 'spotify_auth_state';
const routes = express.Router();
let env = {};

if(process.env.NODE_ENV !== 'production'){
  env = require('../env.json');
  process.env.s_client_id = env.s_client_id;
  process.env.s_client_secret = env.s_client_secret;
  process.env.s_redirect_uri = env.s_redirect_uri;
}

function generateRandomString(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

routes.get('/auth/spotify', (req, res) => {
  let state = generateRandomString(16);
  let scope = 'user-read-private user-read-email';
  res.cookie(stateKey, state);
  
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: process.env.s_client_id,
      scope: scope,
      redirect_uri: process.env.s_redirect_uri,
      state: state
    }));
});

routes.get('/callback', (req, res) => {
  let code = req.query.code || null;
  let state = req.query.state || null;
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: process.env.s_redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer(process.env.s_client_id + ':' + process.env.s_client_secret).toString('base64'))
    },
    json: true
  };
  let storedState = req.cookies ? req.cookies[stateKey] : null;
  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        req.session.s_access_token = body.access_token;
        req.session.s_refresh_token = body.refresh_token;
        res.redirect('/auth/spotify/refresh_user_data');
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

routes.get('/auth/spotify/refresh_user_data', (req, res) => {
  let options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + req.session.s_access_token },
    json: true
  };
  request.get(options, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      // find || create in db if there was one
      req.session.current_user = body
      console.log('🎃', req.session,'🎃')
      req.session.save((err) => {
        console.log('session save err 🌵', err)
      })
    }
  });
  res.redirect('/')
})

routes.get('/auth/validate', (req, res) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  console.log('👻',req.session, res.locals,'👻')
  if (req.session.s_access_token) {
    res.json({
      isAuthenticated : "true", 
      user: req.session.current_user,
      access_token: req.session.s_access_token
    })
  } else {
    res.json({isAuthenticated : "false"});
  }
})

routes.get('/auth/spotify/refresh_token', (req, res) => {
  let refresh_token = req.query.refresh_token;
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: {'Authorization': 'Basic ' + (new Buffer(process.env.s_client_id + ':' + process.env.s_client_secret).toString('base64'))},
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };
  
  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      let access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

export { routes }