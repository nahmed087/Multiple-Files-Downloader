const request = require('request')
const fs = require('fs')
const cliProgress = require('cli-progress')
const readline = require('readline')
const path = require('path')


const download = (url, filename) => {
    return new Promise((resolve, reject) => {
        const progressBar = new cliProgress.SingleBar({
            format: '{bar} {percentage}% | ETA: {eta}s'
        }, cliProgress.Presets.shades_classic)
    
        const file = fs.createWriteStream(filename)
        let receivedBytes = 0

        request.get(url)
        .on('response', response => {
            if(response.statusCode !== 200) {
                // fs.unlink(filename)
                fs.unlinkSync(filename)
                return reject({statusCode: 404, message: 'File Not Found'})
            }
            const totalBytes = response.headers['content-length']
            progressBar.start(totalBytes, 0)
        })
        .on('data', chunk => {
            receivedBytes += chunk.length
            progressBar.update(receivedBytes)
        })
        .pipe(file)
        .on('error', err => {
            fs.unlink(path.join(__dirname, filename))
            progressBar.stop()
            return reject(err.message)
        })

        file.on('finish', () => {
            progressBar.stop()
            file.close(() => resolve({success: true}))
        })
    
        file.on('error', err => {
            fs.unlink(path.join(__dirname, filename))
            progressBar.stop()
            return reject(err.message)
        })
    })
}

async function startDownload(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl.question("Enter staring number ", async startNum => {
        rl.question("Enter ending number ", async endNum => {

            if(isNaN(startNum) || isNaN(endNum)) {
                console.log('Staring number or ending number is not a number')
                rl.close()
            }

            if(parseInt(endNum) < parseInt(startNum)){
                console.log('Ending number cannot be less than starting number')
                rl.close()
                return
            }

            for(let i = parseInt(startNum); i<= parseInt(endNum); i++)
            {
                try
                {
                    const url = `https://www.xilinx.com/publications/archives/xcell/Xcell${i}.pdf`
                    const filename = `Xcell${i}.pdf`
                    const response = await download(url, filename)
                    if(response.success){
                        console.log(`Successfully downloaded ${filename}`)
                    }
                }
                catch(err)
                {
                    if(err.statusCode === 404)
                    {
                        console.error(err.message)
                    }
                }
            }
            rl.close()
        })
    })
}

startDownload()