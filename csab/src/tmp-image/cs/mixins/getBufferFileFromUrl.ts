import * as https from 'https';

const getBufferFileFromUrl = async (url: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        https.get(url, async(res) => {            
            const data: any[] = [];
    
            res.on('data', function(chunk) {
                data.push(chunk);
            });
            
            res.on('end', function() {
                try {
                    const buffer = Buffer.concat(data);
                    
                    return resolve(buffer);
                } catch (err){
                    reject(err)
                };
            });
        }).on('error', (err) => reject(err));
    })
}

module.exports = getBufferFileFromUrl;
export default getBufferFileFromUrl;