export const base64ToBuffer = (base64str: string) => {
    console.log('asdasd')
    const mimeType = getBase64FileMimeType(base64str);

    const stringToCut = `data:${mimeType};base64,`;
    const base64strProcessed = base64str.replace(stringToCut, "");

    const bufLength = Buffer.byteLength(base64strProcessed, 'base64');    
    const buffer = Buffer.alloc(bufLength, base64strProcessed, 'base64');

    return buffer;
}

const getBase64FileMimeType = (base64str) => {
    // base64 encoded data doesn't contain commas    
    const base64ContentArray = base64str.split(",");    
    // base64 content cannot contain whitespaces but nevertheless skip if there are!
    const mimeType = base64ContentArray[0].match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/)[0];
    
    return mimeType;
}
