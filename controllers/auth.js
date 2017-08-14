module.exports = function (router) {


	var path = require('path');
	var request = require('request');
	var simple_oauth2 = require('simple-oauth2');

	var ft_user = require('./user');

	const github_credentials = {
		client: {
			id: '57040590ab486c7f6a6c',
			secret: '72aea3a9777d3f618e23c1eb38aa18c3482a00f1'
		},
		auth: {
			authorizePath: '/login/oauth/authorize',
			tokenPath: '/login/oauth/access_token',
			tokenHost: 'https://github.com/login/'
		}
	};
	const duoquadra_credentials = {
		client: {
			id: 'fee8032a5bf833fc26bd7881b7e649f0c965b9f1318328949371b6ff67188ca4',
			secret: '9f4fb69588c16bdd7b94128ec84e1f9c71c8f3dcf4893b255fbca6a9c270f84d'
		},
		auth: {
			authorizePath: '/oauth',
			tokenPath: '/oauth/token',
			tokenHost: 'https://api.intra.42.fr'
		}
	};
	const google_credentials = {
		client: {
			id: '478472455892-lll12osp67sb6vnb0p5t30rbccus0pd9.apps.googleusercontent.com',
			secret: 'NVtctw0rk08RtNW9BKRofX_x'
		},
		auth: {
			authorizePath: '/o/oauth2/v2/auth',
			authorizeHost: 'https://accounts.google.com',
			tokenPath: '/oauth2/v4/token',
			tokenHost: 'https://www.googleapis.com'
		}
	};

	const reddit_credentials = {
		client: {
			id: 'WXeW2yDnUBFZpQ',
			secret: 'l5gSiW4fpqnBxKerf6D6vFJHRIw'
		},
		auth: {
			authorizePath: '/api/v1/authorize',
			authorizeHost: 'https://www.reddit.com',
			tokenPath: '/api/v1/access_token',
			tokenHost: 'https://ssl.reddit.com'
		}
	};

	var github_oauth2 = simple_oauth2.create(github_credentials);
	var duoquadra_oauth2 = simple_oauth2.create(duoquadra_credentials);
	var google_oauth2 = simple_oauth2.create(google_credentials);
	var reddit_oauth2 = simple_oauth2.create(reddit_credentials);

	var github_authorization_uri = github_oauth2.authorizationCode.authorizeURL({
		redirect_uri: 'http://localhost:8080/callback_github',
		scope: 'notifications',
		state: '3(#0/!~'
	});
	var duoquadra_authorization_uri = "https://api.intra.42.fr/oauth/authorize?client_id=fee8032a5bf833fc26bd7881b7e649f0c965b9f1318328949371b6ff67188ca4&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback_42&response_type=code";
	var google_authorization_uri = google_oauth2.authorizationCode.authorizeURL({
		redirect_uri: 'http://localhost:8080/callback_google',
		scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
		state: '3(#0/!~'
	});
	var reddit_authorization_uri = reddit_oauth2.authorizationCode.authorizeURL({
		redirect_uri: 'http://localhost:8080/callback_reddit',
		scope: 'identity',
		state: '3(#0/!~'
	});

	router.get('/auth_github', function (req, res) {
		res.redirect(github_authorization_uri);
	});

	router.get('/auth_42', function (req, res) {
		res.redirect(duoquadra_authorization_uri);
	});

	router.get('/auth_google', function (req, res) {
		res.redirect(google_authorization_uri);
	});

	router.get('/auth_reddit', function (req, res) {
		res.redirect(reddit_authorization_uri);
	});

	router.get('/callback_github', function (req, res) {
		var code = req.query.code;
		var users = req.db.collection('users');

		github_oauth2.authorizationCode.getToken({
			code: code,
			redirect_uri: 'http://localhost:8080/callback_github'
		}, saveToken);

		function saveToken(error, result) {
			console.log(result);
			if (error) { console.log('Github Access Token Error', error.message); }
			var token = github_oauth2.accessToken.create(result);
			saveGithubProfile(token);
		}

		function saveGithubProfile (token) {
			request.get('https://api.github.com/user', {
				'auth': {
					'bearer': token.token.access_token
				},
				'headers': {
					'User-Agent': 'Hypertube'
				}
			}, saveGithubLogin);
		}

		function saveGithubLogin(error, response, body) {
			if (error) {
				console.log('error:', error);
				res.redirect('/');
			} else {
				var api_resp = JSON.parse(body);
				if (api_resp
						&& (req.session.username = api_resp.login)
						&& (req.session.oauth = 'github'))
				{
					users.findOne({"username" : api_resp.login, "oauth": "github"}, function(err, user) {
						if (err) throw err;
						if (!user) {
							users.insert({
								'firstname'  : api_resp.name,
								'lastname' 	: api_resp.name,
								'email' 			: api_resp.email,
								'username'		: api_resp.login,
								'oauth'				: 'github'
							});
							ft_user.saveIpLocation(req.db, req, res);
						}
					});
				}
				res.redirect('/');
			}
		}

	});

	router.get('/callback_42', function (req, res) {
		var code = req.query.code;
		var users = req.db.collection('users');

		console.log('/callback_42');
		duoquadra_oauth2.authorizationCode.getToken({
			code: code,
			redirect_uri: 'http://localhost:8080/callback_42'
		}, saveToken);

		function saveToken(error, result) {
			if (error) { console.log('42 Access Token Error', error.message); }
			var token = duoquadra_oauth2.accessToken.create(result);
			save42Profile(token);
		}

		function save42Profile (token) {
			request.get('https://api.intra.42.fr/v2/me', {
				'auth': {
					'bearer': token.token.access_token
				},
				'headers': {
					'User-Agent': 'Hypertube'
				}
			}, save42Login);
		}

		function save42Login(error, response, body) {
			if (error) {
				console.log('error:', error);
				res.redirect('/');
			} else {
				var api_resp = JSON.parse(body);
				if (api_resp
							&& (req.session.username = api_resp.login)
							&& (req.session.oauth = '42')) {

					users.findOne({"username" : api_resp.login, "oauth": "42"}, function(err, user) {
						if (err) throw err;
						if (!user) {
							users.insert({
								'firstname'  : api_resp.first_name,
								'lastname' 	: api_resp.last_name,
								'email' 			: api_resp.email,
								'username'		: api_resp.login,
								'oauth'				: "42"
							});
							ft_user.saveIpLocation(req.db, req, res);
						}
					});

				}
				res.redirect('/');
			}
		}

	});

	router.get('/callback_google', function (req, res) {
		var code = req.query.code;
		var users = req.db.collection('users');

		console.log('/callback_google | CODE : ' + code);
		google_oauth2.authorizationCode.getToken({
			code: code,
			redirect_uri: 'http://localhost:8080/callback_google'
		}, saveToken);

		function saveToken(error, result) {
			if (error) { console.log('Google Access Token Error', error.message); }
			var token = google_oauth2.accessToken.create(result);
			console.log("GOOGLE TOKEN" + JSON.stringify(token));
			saveGoogleProfile(token);
		}

		function saveGoogleProfile (token) {
			request.get('https://www.googleapis.com/oauth2/v3/userinfo', {
				'auth': {
					'bearer': token.token.access_token
				}
			}, saveGoogleLogin);
		}
		function saveGoogleLogin(error, response, body) {
			console.log("JSON RESP : " + JSON.stringify(body));
			if (error) {
				console.log('error:', error);
				res.redirect('/');
			} else {
				var api_resp = JSON.parse(body);
				if (api_resp
							&& (req.session.username = api_resp.name)
							&& (req.session.oauth = 'google')) {

					users.findOne({"username" : api_resp.name, "oauth": "google"}, function(err, user) {
						if (err) throw err;
						if (!user) {
							users.insert({
								'firstname'  : api_resp.given_name,
								'lastname' 	: api_resp.family_name,
								'email' 			: api_resp.email,
								'username'			: api_resp.name,
								'oauth'				: "google"
							});
							ft_user.saveIpLocation(req.db, req, res);
						}
					});
				}
				res.redirect('/');
			}
		}
	});

	router.get('/callback_reddit', function (req, res) {
		var code = req.query.code;
		var users = req.db.collection('users');

		console.log('/callback_reddit | CODE : ' + code);
		reddit_oauth2.authorizationCode.getToken({
			code: code,
			redirect_uri: 'http://localhost:8080/callback_reddit'
		}, saveToken);

		function saveToken(error, result) {
			if (error) { console.log('Reddit Access Token Error: ', error.message); }
			var token = google_oauth2.accessToken.create(result);
			console.log("REDDIT TOKEN" + JSON.stringify(token));
			saveRedditProfile(token);
		}

		function saveRedditProfile (token) {
			request.get('https://oauth.reddit.com/api/v1/me', {
				'auth': {
					'bearer': token.token.access_token
				},
				'headers': {
					'User-Agent': 'chrome:com.hypertube.hypertubeApp:v1.2.3'
				}
			}, saveRedditLogin);
		}
		function saveRedditLogin(error, response, body) {
			if (error) {
				console.log('error:', error);
				res.redirect('/');
			} else {
				var api_resp = JSON.parse(body);
				if (api_resp
							&& (req.session.username = api_resp.name)
							&& (req.session.oauth = 'reddit')) {

					users.findOne({"username" : api_resp.name, "oauth": "reddit"}, function(err, user) {
						if (err) throw err;
						if (!user) {
							users.insert({
								'firstname'  : api_resp.name,
								'lastname' 	: api_resp.name,
								'username'			: api_resp.name,
								'oauth'				: "reddit"
							});
							ft_user.saveIpLocation(req.db, req, res);
						}
					});
				}
				res.redirect('/');
			}
		}

	});

}
