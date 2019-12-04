let AWS = require('aws-sdk');
const mysql = require('promise-mysql');
const multiparty = require('multiparty');
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
uploadPicture = async (repo, path, buffer,type ) => {
    const timestamp = Date.now().toString();
    const params = {
        ACL: 'public-read',
        Body: buffer,
        Bucket: process.env.AWS_BUCKET_NAME,
        ContentType: type.mime,
        Key: `${repo}/${timestamp}-${repo}.${type.ext}`
    };
    await s3.upload(params).promise();
    return `${repo}/${timestamp}-${repo}.${type.ext}`;
}
module.exports = {
    uploadPicture : async (repo, path, buffer,type) => {
        await uploadPicture(repo, path, buffer,type)
    }
}
