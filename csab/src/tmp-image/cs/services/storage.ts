import * as config from 'config';
import * as AWS from 'aws-sdk';

export class StorageBulkDeleteError extends Error {
    constructor(public readonly successKeys: string[], public readonly errorKeys: string[]) {
        super('Не удалось удалить все указанные файлы');
    }
}

export default class Storage {

    private s3: AWS.S3;
    private bucket: string;
    
    constructor() {
        const accessKeyId: string = config.get('keys.amazonAccessKeyID');
        const secretAccessKey: string = config.get('keys.amazonSecretAccessKey');
        this.bucket = config.get('keys.amazonBucket');
        
        AWS.config.update({
            accessKeyId,
            secretAccessKey
        });

        this.s3 = new AWS.S3();
    }

    async upload(file: Buffer, filename: string) {
        try {
    
            //configuring parameters
            var params = {
                Bucket: this.bucket,
                Body: file,
                Key: filename
            };
            
            const result = await this.s3.upload(params).promise();  
            
            return result.Location;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async delete(filename: string) {

        try {
            const params = {
                Bucket: this.bucket,
                Key : filename
            };
            
            await this.s3.deleteObject(params).promise();

        } catch (err) {
            console.error(err);
            throw err;
        }

    }

    async rename(srcFilename: string, destFilename: string) {
        
        try {
            await this.s3.copyObject({
                Bucket: this.bucket,
                CopySource: encodeURIComponent(`${this.bucket}/${srcFilename}`),
                Key: destFilename,
            }).promise();

            await this.s3.deleteObject({
                Bucket: this.bucket,
                Key: srcFilename
            }).promise();

            const url = `https://${this.bucket}.s3.amazonaws.com/${destFilename}`;
            
            return url;

        } catch (err) {
            console.error(err);
            throw err;
        }

    }

    async bulkDelete(filenames: string[]) {

        try {
            const params: AWS.S3.DeleteObjectsRequest = {
                Bucket: this.bucket,
                Delete: {
                    Objects: filenames.map<AWS.S3.ObjectIdentifier>(filename => ({ Key: filename })),
                }
            };
            
            const result = await this.s3.deleteObjects(params).promise();
            if(result.Errors && result.Errors.length)
                throw new StorageBulkDeleteError(
                    result.Deleted.map(ok => ok.Key), 
                    result.Errors.map(er => er.Key)
                );

        } catch (err) {
            console.error(err);
            throw err;
        }

    }

}