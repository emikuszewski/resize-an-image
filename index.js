const gm = require('gm').subClass({imageMagick: true});
const path = require('path');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

exports.resizeImagers = (event, context) => {
  const file = storage.bucket(event.bucket).file(event.name);
  if (file.name.startsWith('resized-')) { return; } //process once
  return resizer(file);
};

function resizer(file) {
  const tempLocalPath = `/tmp/${path.parse(file.name).base}`;
  return file
  	.download({destination: tempLocalPath}) //Download from bucket
  	.then(() => {
    	return new Promise((resolve, reject) => {
          gm(tempLocalPath)
          	.resize(256)
          	.write(tempLocalPath, (err, stdout) => {
            	if (err) { reject(err); }
            	else { resolve(stdout); }
          });
    });
  })
  .then(() => {
    return file.bucket.upload(tempLocalPath, {destination: `resized-${file.name}`});
  });
}
  