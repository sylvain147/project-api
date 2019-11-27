const express = require('express');
const app = express();
const mysql = require('promise-mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const slugify = require('slug');
require('dotenv').config();
let jwt = require('jsonwebtoken');
let cors = require('cors');
const multer = require("multer");
var upload = multer();

import('./image.js');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
let params = {
    host     : process.env.DB_HOST,
    user     : process.env.DB_USER,
    password : process.env.DB_PASSWORD,
    database : process.env.DB_NAME,
};
const myMiddleware = (req, res, next) => {
    if (req.headers['authorization'] !== 'null') {
        jwt.verify(req.headers['authorization'],'untrucsecret', function (err, decoded) {
            if(err) next();
            req.user = decoded
        })
    }
    next()
};

let connection;

const getConnection = async  () => {
    if (connection) {
        return connection
    }

    connection = await mysql.createConnection(params);

    return connection
};

app.get('/api/article/:id', async (req,res) => {
    const connection = await getConnection();
    connection.query('SELECT * from article where article_id = ?', [req.params.id], function (error, results) {
        res.send(results)
    });
}).get('/api/articles', async (req,res) => {
    const connection = await getConnection();
    connection.query('SELECT article_id,title, article.data, user.username, article.created_at from article JOIN articlesUsers ON article.article_id = articlesUsers.article JOIN user ON user.user_id = articlesUsers.user' ,function (error, results) {
        res.send(results)
    });

}).get('/api/user/:id', async (req,res) => {
    const connection = await getConnection();
    connection.query('SELECT * from user where user_id = ?', [req.params.id], function (error, results) {
        res.send(results)
    });

}).get('/api/users', async (req,res) => {
    const connection = await getConnection();
    connection.query('SELECT * from user' ,function (error, results) {
        res.send(results)
    });

}).post('/api/article', upload.none(), async function (req,res) {
    const connection = await getConnection();
    let body = req.body;
    let title = body.title;
    let userId = body.userId;
    let slug = body.slug;
    if( !title || !userId || !slug) {
        res.sendStatus(400);
        return;
    }
    delete body.title;
    delete body.userId;
    delete body.slug;
    let user = await connection.query("SELECT * from user where user_id = ?", [userId]);
    if (user.length === 0){
        res.sendStatus(404);
        return;
    }
    connection.query("INSERT INTO article set ?", {title: title,slug:slug, data : JSON.stringify(body), created_at : new Date()},function (error, results) {
        console.log(error);
        let articleId = results.insertId;
        connection.query("INSERT INTO articlesUsers set ?", {user : userId, article : articleId })
    });

    res.sendStatus(200)
}).post('/api/user', async (req, res) => {
    const connection = await getConnection();
    let body = req.body;
    let username = body.username;
    delete body.username;
    let password = body.password;

    delete body.password;
    let email = body.email;
    delete body.email;
    if(!username || !password || !email) {
        res.send(400);
        return;
    }
    bcrypt.hash(password,10, (err,hash)=> {
        connection.query('INSERT INTO user set ?', {username : username, password : hash, email : email, data : JSON.stringify(body), created_at: new Date()}, (error, resutl) => {
            if (error) {
                res.sendStatus(400)
            }
            else {
                res.sendStatus(200)
            }
        });
    });
}).post('/api/login', async (req,res) => {
    const connection = await getConnection();
    let user = await connection.query('SELECT * from user where username = ?', [req.body.username]);
    if(user.length === 0){
        res.sendStatus(401);
        return;
    }
    bcrypt.compare(req.body.password, user[0].password, (err,result) => {
        if (result){
            let token = jwt.sign(
                {
                    exp : Math.floor(Date.now() / 1000) + (60 * 60),
                    user : user[0]
                },
                'untrucsecret'
            );
            res.send({'token' : token});
            return
        }
        res.sendStatus(401);
    })
}).post('/api/authed', myMiddleware, async (req, res) => {
    if(!req.user) res.sendStatus(401);
    res.send(req.user)
}).get('/api/slug', async(req, res)=> {
    let i = 0;
    const connection = await getConnection();
    let originalSlug=  slugify(req.query.title);
    let slug = originalSlug;
    let result = await connection.query('SELECT * from article where slug = ?',[slug]);
    while (result.length > 0){
        i++;
        slug = originalSlug+'-'+i;
        result = await connection.query('SELECT * from article where slug = ?',[slug])
    }
    res.send(slug);
}).put('/api/user/:id',upload.none(), async (req,res) => {
    const connection = await getConnection();
    connection.query('UPDATE user set data = ? where user_id = ?',[JSON.stringify(req.body), req.params.id] , async (error, res) => {
        console.log(error)
    })
});


app.listen(process.env.APP_PORT);
