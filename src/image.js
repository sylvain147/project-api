const multer = require("multer");
let AWS = require('aws-sdk');
const fs = require('fs');
const BUCKET = 'picture-rougetube';
const REGION = 'eu-west-3';

const multiparty = require('multiparty');
const fileType = require('file-type');

const localImage = './public/uploads/IMAGE-1574694327815.jpg';
const imageRemoteName = `test6.jpg`;


AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS,
    secretAccessKey: process.env.AWS_SECRET,
    region: REGION
});
let s3 = new AWS.S3();

uploadImage = async (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, async (error, fields, files) => {
        if (error) throw new Error(error);
        try {
            const path = files.file[0].path;
            const buffer = fs.readFileSync(path);
            const type = fileType(buffer);
            const timestamp = Date.now().toString();
            const fileName = `avatar/${timestamp}-lg`;
            const data = await uploadFile(buffer, fileName, type);
            res.send(fileName+'.'+type.ext);
        } catch (error) {
            return res.status(400).send(error);
        }
    });

};
uploadFile = async (buffer, name, type) => {
    const params = {
        ACL: 'public-read',
        Body: buffer,
        Bucket: BUCKET,
        ContentType: type.mime,
        Key: `${name}.${type.ext}`
    };
    return s3.upload(params).promise();
}
module.exports = {
    uploadImage: async (req, res) => {
        await uploadImage(req, res)
    }
};