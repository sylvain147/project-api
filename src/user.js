const mysql = require('promise-mysql');
const bcrypt = require('bcrypt');
const multiparty = require('multiparty');

const fs = require('fs');
const fileType = require('file-type');

let jwt = require('jsonwebtoken');
let connection;
let params = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
const image = require('./image')
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
        if(error) { res.sendStatus(500)}
        return;
    });
    res.sendStatus(200)
};
updateAvatar = async (req, res) => {
    let connection = await getConnection();
    const form = new multiparty.Form();
    try {
        form.parse(req, async (error, fields, files) => {
            const path = files.file[0].path;
            console.log(path)

            const buffer = fs.readFileSync(path);
            console.log(buffer)
            const type = fileType(buffer);
            console.log(type)
            const avatar = await image.uploadPicture('avatar', path, buffer, type);
            console.log(avatar)
            connection.query('UPDATE user set avatar = ? where user_id = ?', [`${avatar}`, fields.id[0]])
            res.send(avatar)
        })
    } catch(error)  {
        res.sendStatus(500)

    }

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
