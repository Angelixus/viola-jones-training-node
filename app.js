const express = require('express')
const morgan = require('morgan')
const multer = require('multer');
const path = require('path');
const uuid = require('uuid');
const fs = require('fs');

console.log("TEST")

const dirBase = './images';
const dirPositive = './images/goodConditions'
const dirNegative = './images/badConditions'

if (!fs.existsSync(dirBase)){
    fs.mkdirSync(dirBase);
}

if (!fs.existsSync(dirPositive)){
    fs.mkdirSync(dirPositive);
}

if (!fs.existsSync(dirNegative)){
    fs.mkdirSync(dirNegative);
}


const { exec } = require('child_process')

const app = express()

app.listen(8080, () => {
    console.log('Listening on port 8080')
})

app.use(morgan('short'))


const storageGoodCondition = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images/goodConditions')
    },
    filename: function (req, file, callback) {
        callback(null, uuid.v4() + path.extname(file.originalname))
    }
})

var uploadGoodCondition = multer({ storage: storageGoodCondition })

const storageBadCondition = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images/badConditions')
    },
    filename: function (req, file, callback) {
        callback(null, uuid.v4() + path.extname(file.originalname))
    }
})

var uploadBadCondition = multer({ storage: storageBadCondition })


app.post('/goodConditionImages', uploadGoodCondition.array('files'), (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hola Mundo');
})

app.post('/badConditionImages', uploadBadCondition.array('files'), () => {
    /*fs.readdir('./uploads', (err, files) => {
    console.log(files.length);
  });*/
})