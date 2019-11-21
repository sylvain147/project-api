const express = require('express');
const app = express();
const mysql = require('promise-mysql');
const bodyParser = require('body-parser');
require('dotenv').config();
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

app.get('/api/article/:id', async (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    const connection = await mysql.createConnection(params);
    connection.query('SELECT * from article where article_id = ?', [req.params.id], function (error, results) {
        res.send(results)
    })
}).get('/api/articles', async (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    const connection = await mysql.createConnection(params);
    connection.query('SELECT article_id,title, article.data, user.username, article.created_at from article JOIN articlesUsers ON article.article_id = articlesUsers.article JOIN user ON user.user_id = articlesUsers.user' ,function (error, results) {
        console.log(error)
        res.send(results)
    })
}).get('/api/user/:id', async (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    const connection = await mysql.createConnection(params);
    connection.query('SELECT * from user where user_id = ?', [req.params.id], function (error, results) {
        console.log(error)
        res.send(results)
    })
}).get('/api/users', async (req,res) => {
    const connection = await mysql.createConnection(params);
    connection.query('SELECT * from user' ,function (error, results) {
        res.send(results)
    })
}).post('/api/article', async function (req,res) {
    const connection = await mysql.createConnection(params);
    let body = req.body;
    let title = body.title;
    let userId = body.userId;
    if( !title || !userId) {
        res.sendStatus(400);
        return;
    }
    delete body.title;
    let user = await connection.query("SELECT * from user where user_id = ?", [userId]);
    if (user.length === 0){
        res.sendStatus(404);
        return;
    }
    connection.query("INSERT INTO article set ?", {title: title, data : JSON.stringify(body), created_at : new Date()},function (error, results) {
        console.log(error)
        let articleId = results.insertId;
        connection.query("INSERT INTO articlesUsers set ?", {user : userId, article : articleId })
    });
    res.sendStatus(200)
}).post('/api/user', async function (req, res){
    const connection = await mysql.createConnection(params);
    let body = req.body;
    let username = body.username;
    delete body.title;
    let password = body.password;
    delete body.password;
    let email = body.email;
    delete body.email;
    if(!username || !password || !email) {
        res.send(400);
        return;
    }
    connection.query('INSERT INTO user set ?', {username : username, password : password, email : email, data : JSON.stringify(body), created_at: new Date()});
    res.sendStatus(200);
});

app.listen(process.env.APP_PORT);