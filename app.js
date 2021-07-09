const express = require('express')
const morgan = require('morgan')
const multer = require('multer');
const path = require('path');
const uuid = require('uuid');
const fs = require('fs');
const { exec } = require("child_process");
var sizeOf = require('image-size');


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
    const baseDirGood = 'images/goodConditions'
    const goodConditionTxtName = 'pos.txt'
    let filesLengthGood = 0;
    fs.readdir(baseDirGood, (err, files) => {
        if(err) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`error: ${err.message}`);
        } else {
            let stringToWrite = ''
            filesLengthGood = files.length
            files.forEach(function (file) {
                const filename = baseDirGood + '/' + file
                var dimensions = sizeOf(filename);
                stringToWrite = stringToWrite.concat(`${filename} 1 0 0 ${dimensions.width} ${dimensions.height}\n`)
            });
            stringToWrite = stringToWrite.slice(0, -1)
            fs.writeFile('goodConditionTxtName', stringToWrite, function (err) {
                if (err) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end(`error: ${err.message}`);
                } 
              });
        }
    })
    
    const widthWindow = 24
    const heightWindow = 24
    const sample = 0.9
    exec(`opencv_createsamples -info ${goodConditionTxtName} -w ${widthWindow} -h ${heightWindow} -num ${filesLengthGood * 4} -vec pos.vec`, (error, stdout, stderr) => {
        if (error) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`error: ${error.message}`);
        }
        if (stderr) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain');
            res.end(`stderr: ${stderr}`);
        }

        exec(`opencv_traincascade -data cascade/ -vec pos.vec -bg bg.txt -w ${widthWindow} -h ${heightWindow} -numPos ${Math.imul(filesLengthGood, sample)} -numNeg ${Math.floor((Math.imul(filesLengthGood, sample)) / 2)} -numStages 10 -featureType HAAR -stageType BOOST`, (error, stdout, stderr) => {
            if (error) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end(`error: ${error.message}`);
            }
            if (stderr) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end(`stderr: ${stderr}`);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain')
            res.end("Correct")
        })
    });

})

app.post('/badConditionImages', uploadBadCondition.array('files'), () => {
    /*fs.readdir('./uploads', (err, files) => {
    console.log(files.length);
  });*/
})

app.get('/images', (req, res) => {
    fs.readdir('./images/goodConditions', (err, files) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end(`numfiles: ${files.length}`);     
     });
})