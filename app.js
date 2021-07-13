const express = require('express')
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


const storageGoodCondition = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './images/goodConditions')
    },
    filename: function (req, file, callback) {
        callback(null, uuid.v4().replace(/-/g, '') + path.extname(file.originalname))
    }
})

var uploadGoodCondition = multer({ storage: storageGoodCondition })

app.post('/goodConditionImages', uploadGoodCondition.array('files'), (req, res) => {
    const baseDirGood = 'images/goodConditions'
    const goodConditionTxtName = 'pos.txt'
    let filesLengthGood = 0;
    fs.readdir('./images/goodConditions', (err, files) => {
        if(err) {
            return res.status(500).json(`error: ${err.message}`);
        } else {
            let stringToWrite = ''
            filesLengthGood = files.length
            files.forEach(function (file) {
                const filename = baseDirGood + '/' + file
                var dimensions = sizeOf(filename);
                stringToWrite = stringToWrite.concat(`${filename} 1 0 0 ${dimensions.width} ${dimensions.height}\n`)
            });
            stringToWrite = stringToWrite.slice(0, -1)
            fs.writeFile(goodConditionTxtName, stringToWrite, function (err) {
                if (err) {
                    return res.status(500).json(`error: ${err.message}`);
                } 
              });
        }

        const widthWindow = 24
        const heightWindow = 12
        const sample = 0.9

        exec(`opencv_createsamples -info ${goodConditionTxtName} -vec pos.vec -w ${widthWindow * 5} -h ${heightWindow * 5} -num ${filesLengthGood * 4}`, (error, stdout, stderr) => {
            if (error) {
                return res.status(500).json(`error: ${error.message}`);
            }

            exec(`opencv_traincascade -data cascade/ -vec pos.vec -bg bg.txt -w ${widthWindow * 5} -h ${heightWindow * 5} -numPos ${Math.floor(filesLengthGood * sample)} -numNeg ${Math.floor((filesLengthGood * sample) / 2)} -numStages 10 -featureType HAAR -stageType BOOST`, (error, stdout, stderr) => {
                if (error) {
                    return res.status(500).json(`error: ${error.message}`);
                }
                if (stderr) {
                    return res.status(500).json(`error: ${stderr}`);
                }

                let filePath = path.join(__dirname, 'cascade/cascade.xml') 
                var stat = fs.statSync(filePath);
                res.writeHead(200, {
                    'Content-Type': 'application/xml',
                    'Content-Lenght': stat.size
                })
                let readStream = fs.createReadStream(filePath)
                readStream.pipe(res)

                fs.readdir('./images/goodConditions', (err, files) => {
                    if (err) {
                        return res.status(500).json(`error: ${err.message}`);
                    }
                    files.forEach((file) => {
                        fs.unlink(path.join('./images/goodConditions', file), err => {
                            if (err) {
                                return res.status(500).json(`error: ${err.message}`);
                            }
                        })
                    })
                  })

                  fs.readdir('./cascade', (err, files) => {
                    if (err) {
                        return res.status(500).json(`error: ${err.message}`);
                    }
                    files.forEach((file) => {
                        fs.unlink(path.join('./cascade', file), err => {
                            if (err) {
                                return res.status(500).json(`error: ${err.message}`);
                            }
                        })
                    })
                  })

                  fs.unlink('pos.txt', err => {
                        if (err) {
                            return res.status(500).json(`error: ${err.message}`);
                        }
                    })
                
                    fs.unlink('pos.vec', err => {
                        if (err) {
                            return res.status(500).json(`error: ${err.message}`);
                        }
                    })
                  return;
            })
        });
    })
})