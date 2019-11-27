const express = require('express');
const app = express();
const mysql = require('promise-mysql');
const bodyParser = require('body-parser');
require('dotenv').config();
var AWS = require('aws-sdk');
var s3 = new AWS.S3()
let jwt = require('jsonwebtoken');
const path = require("path");
const multer = require("multer");
const storage = multer.diskStorage({
    destination: "./public/uploads/",
    filename: function(req, file, cb){
        cb(null,"IMAGE-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
}).single("myImage");
const router = express.Router();
let cors = require('cors');

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
            if(err) next()
            req.user = decoded
        })
    }
    next()
};

let connection

const getConnection = async  () => {
    if (connection) {
        return connection
    }

    connection = await mysql.createConnection(params)

    return connection
}

app.post('/api/image', (req,res) => {
    var file = upload(req, res, (err) => {
        return req.file.path
    });

    var AWS = require('aws-sdk')
    const fs = require('fs')

    const BUCKET = 'picture-rougetube'
    const REGION = 'eu-west-3'

    const localImage = './public/uploads/IMAGE-1574694327815.jpg'
    const imageRemoteName = `test2.jpg`

    AWS.config.update({
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_KEY,
        region: REGION
    })

    var s3 = new AWS.S3()

    s3.putObject({
        Bucket: BUCKET,
        Body: fs.readFileSync(localImage),
        Key: imageRemoteName
    })
        .promise()
        .then(response => {
            console.log(`done! - `, response)
            console.log(
                `The URL is ${s3.getSignedUrl('getObject', { Bucket: BUCKET, Key: imageRemoteName })}`
            )
        })
        .catch(err => {
            console.log('failed:', err)
        })
}).get('/imaage', async (req,res) => {
    const connection = await getConnection();
    var params = { Bucket: 'picture-rougetube', Key: 'test2.jpg' };
    s3.getObject(params, function(err, data) {
        if (err) {
            return res.send({ error: err });
        }
        res.send(data.Body);
    });
})




