const https = require('https');
const fs = require('fs');
const Stream = require('stream').Transform;
const sizeOf = require('image-size');
const YAML = require('yaml');
const outDir = './dist';
const cfg = YAML.parse(fs.readFileSync('./config.yaml', 'utf8'));
const src = cfg.url;

init().then(() => console.log('Done!'));

let imgs = {};

async function init(){
    mkdirs();
    // First do some start up
    // First, make then directories
    let json = await fetch(src);
    let slides = json.storymap.slides;

    resolveImages(slides);
    await downloadImages(slides);

   // Now add the JSON
   fs.writeFileSync(`${outDir}/json/out.json`, JSON.stringify(json));
}

function mkdirs() {
    ['','images','json'].forEach(dir => {
        let dirName = outDir + '/' + dir;
        console.log(`Making dir ${dirName}`);
        if (fs.existsSync(dirName)) {
            console.log(`Dir ${dirName} already exists`);
            return;
        }
        fs.mkdirSync(dirName);
    });
}

 function downloadImages(){
    let downloads = [];
    for (const [out, dest] of Object.entries(imgs)){
        downloads.push(binaryFetch(out, dest));
    }
}

function resolveImages(slides){
    const getDest =  function(obj, prop) {
                if (!obj.hasOwnProperty(prop)) {
                    return;
                }
                let url = obj[prop];
                if (!(/^http/gi.test(url))) {
                    url = 'http:' + url;
                }
                if (!imgs.hasOwnProperty(url) && /uploads\.knightlab/.test(url)) {
                    let dest = url.split('/').reverse()[0];
                    let out = `${outDir}/images/${dest}`;
                    imgs[url] = out;
                    return out;
                }
                return url;

    };
    const getImgs = function(obj){
       for (const prop in obj){
               if (prop === 'url' || prop === 'icon') {
                   let dest = getDest(obj, prop);
                    obj[prop] = dest;
               }
                else if (typeof obj[prop] === 'object'){
                   getImgs(obj[prop]);
               }
           }
       }

    slides.forEach(getImgs);
    return true;
}

function fetch(url){
    return new Promise((resolve, reject) => {
        https.get(url, response => {
            console.log(`Fetching ${url}`);
            response.setEncoding('utf8');
            let raw = '';
            //Streaming
            response.on('data', (chunk) => { raw += chunk;});
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(raw);
                    resolve(parsedData);
                } catch(e){
                    reject(e);
                    console.error(e);
                }
            })
        })
    });
}

function binaryFetch(url, dest){

    return new Promise((resolve, reject) => {

        if (fs.existsSync(dest)){
            console.log(`${dest} already exists; skipping`);
            return resolve(dest);
        };
        https.request(url, response => {
            console.log(`Fetching ${url} => ${dest}`)
            let data = new Stream();
            response.on('data', chunk => {
                data.push(chunk);
            });
            response.on('end', () => {
                console.log('Downloaded!');
                fs.writeFileSync(dest, data.read());
                return resolve(dest);
            });
            response.on('error', (e) => {
               return reject(e);
               console.error(`${e}`);
            })
        }).end();
    })
}






