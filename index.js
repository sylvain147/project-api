const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require("multer");
let upload = multer();
let jwt = require('jsonwebtoken');
let cors = require('cors');


const article = require('./src/article');
const user = require('./src/user');
const image = require('./src/image');
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
/** Articles **/
//GET functions
app.get('/api/articles', article.getArticles);
app.get('/api/article', article.getArticle);
app.get('/api/slug', article.createSlug);

//POST functions
app.post('/api/article',upload.none(), article.createArticle);
/** fin Articles **/

/** Users **/
//GET functions
const authorize = (req, res, next) => {
    console.log('ok')
    if (req.headers['authorization'] !== 'null') {
        jwt.verify(req.headers['authorization'], 'untrucsecret', function (err, decoded) {
            if (err) next();
            req.user = decoded
        })
    }
    next()
};
app.get('/api/users', user.getUsers);
app.get('/api/user/:id', user.getUser);

//POST functions
app.post('/api/user', user.createUser);
app.post('/api/login', user.login);
app.post('/api/authed', authorize, user.auth);
app.post('/api/reloaduser',authorize,user.reloadUser);

//PUT functions
app.put('/api/user/:id',upload.none(), user.updateUser);
/** FIN users **/
app.post('/api/image', user.updateAvatar);
console.log(process.env.APP_PORT)
app.listen(process.env.APP_PORT);
