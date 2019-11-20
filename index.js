let express = require('express');
let app = express();
let mysql = require('promise-mysql');
let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

let params = {
    host     : 'localhost',
    user     : 'root',
    password : 'password',
    database : 'blog'
};

app.get('/api/article/:id', async function(req,res){
    const connection = await mysql.createConnection(params);
    connection.query('SELECT * from article where article_id = ?', [req.params.id], function (error, results) {
        res.send(results)
    })
});

app.get('/api/articles', async function(req,res){
    const connection = await mysql.createConnection(params);
    connection.query('SELECT * from article' ,function (error, results) {
        res.send(results)
    })
});

app.get('/api/user/:id', async function(req,res){
    const connection = await mysql.createConnection(params);
    connection.query('SELECT * from user where user_id = ?', [req.params.id], function (error, results) {
        console.log(error)
        res.send(results)
    })
});

app.get('/api/users', async function(req,res){
    const connection = await mysql.createConnection(params);
    connection.query('SELECT * from user' ,function (error, results) {
        res.send(results)
    })
});
app.post('/api/article', async function (req,res) {
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
        let articleId = results.insertId;
        connection.query("INSERT INTO articlesUsers set ?", {user : userId, article : articleId })
    });
    res.sendStatus(200)
});

app.post('/api/user', async function (req, res){
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

app.listen(8080);