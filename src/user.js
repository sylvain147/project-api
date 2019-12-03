const mysql = require('promise-mysql');
const bcrypt = require('bcrypt');
let AWS = require('aws-sdk');
let jwt = require('jsonwebtoken');
const fs = require('fs');

const multiparty = require('multiparty');
const fileType = require('file-type');
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
    region: 'eu-west-3'
});
let s3 = new AWS.S3();


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

getUser = async (req,res) => {
    const connection = await getConnection();
    connection.query('SELECT * from user where user_id = ?', [req.params.id], function (error, results) {
        res.send(results)
    });
};
getUsers = async (req, res) => {
    const connection = await getConnection();
    connection.query('SELECT * from user' ,function (error, results) {
        res.send(results)
    });
};
createUser = async (req,res) => {
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

};
login = async (req, res) => {
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
};
auth = async (req, res) => {
    if(!req.user) res.sendStatus(401);
    res.send(req.user)
};
updateUser = async (req,res) => {
    const connection = await getConnection();
    connection.query('UPDATE user set data = ? where user_id = ?',[JSON.stringify(req.body), req.params.id] , async (error, res) => {
        console.log(error);
        if(!error) res.sendStatus(200)
    })
};
updateAvatar = async (req,res) => {
    const form = new multiparty.Form();
    const connection = await getConnection();
    form.parse(req, async (error, fields, files) => {
        if (error) throw new Error(error);
        console.log('here')
        try {
            const path = files.file[0].path;
            const buffer = fs.readFileSync(path);
            const type = fileType(buffer);
            const timestamp = Date.now().toString();
            const fileName = `avatar/${timestamp}-avatar`;
            await uploadPicture(buffer, fileName, type);
            connection.query('UPDATE user set avatar = ? where user_id = ?', [`${fileName}.${type.ext}`,fields.id[0]])
            res.send(fileName+'.'+type.ext);

        } catch (error) {
            return res.status(400).send(error);
        }
    });
}
uploadPicture = async  (buffer, name, type) => {
    const params = {
        ACL: 'public-read',
        Body: buffer,
        Bucket: process.env.AWS_BUCKET_NAME,
        ContentType: type.mime,
        Key: `${name}.${type.ext}`
    };
    return s3.upload(params).promise();
}
reloadUser = async (req,res) => {
    let user = await connection.query('SELECT * from user where user_id = ?', [req.user.user.user_id]);
    let token = jwt.sign(
        {
            exp : Math.floor(Date.now() / 1000) + (60 * 60),
            user : user[0]
        },
        'untrucsecret'
    );
    res.send({token : token})
}
createHas = async () => {

}
module.exports = {
    getUser: async (req,res) => {
        await getUser(req, res);
    },
    getUsers: async (req, res) => {
        await getUsers(req, res);
    },
    createUser : async (req,res) => {
        await createUser(req,res)
    },
    updateUser : async (req,res) => {
        await updateUser(req,res)
    },
    auth : async (req,res) =>{
        await auth(req,res)
    },
    login : async (req,res) =>{
        await login(req,res)
    },
    updateAvatar: async (req, res) => {
        await updateAvatar(req, res)
    },
    reloadUser : async (req,res)=> {
        await reloadUser(req,res)
}
};
