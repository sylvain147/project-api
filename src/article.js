const mysql = require('promise-mysql');
const slugify = require('slug');
require('dotenv').config();

let connection;
let params = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
const getConnection = async () => {
    if (connection) {
        return connection
    }

    connection = await mysql.createConnection(params);

    return connection
};

getArticle = async (req,res) => {
    isNaN(req.query.id) ? await getArticleBySlug(req,res): await getArticleById(req,res)  ;

};
getArticleById = async (req,res) => {
    const connection = await getConnection();
    connection.query('SELECT * from article where article_id = ?', [req.query.id], function (error, results) {
        res.send(results);
    });
};

getArticleBySlug = async (req,res) => {
    const connection = await getConnection();

    connection.query('SELECT * from article where slug = ?', [req.query.id], function (error, results) {
        res.send(results);
    });
};
getArticles = async (req, res) => {
    const connection = await getConnection();
    await connection.query('SELECT article_id,title, article.data, user.username, article.created_at from article JOIN articlesUsers ON article.article_id = articlesUsers.article JOIN user ON user.user_id = articlesUsers.user', function (error, results) {
        res.send(results);
    });
};
createArticle = async (req,res) => {
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
        let articleId = results.insertId;
        connection.query("INSERT INTO articlesUsers set ?", {user : userId, article : articleId })
    });
    res.sendStatus(200)

};
createSlug = async (req,res) => {
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
};

module.exports = {
    getArticle: async (req,res) => {
        await getArticle(req, res);
    },
    getArticles: async (req, res) => {
        await getArticles(req, res);
    },
    createArticle : async (req,res) => {
        await createArticle(req,res)
    },
    createSlug : async (req,res) =>{
        await createSlug(req,res)
    },
};
