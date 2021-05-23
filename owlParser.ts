import xml2js from 'xml2js';
import * as fs from 'fs';

export default class Parser {
    filePath: string;
    private fileContent: string;
    parsedFile = null;
    constructor(filePath: string) {
        this.filePath = filePath;
        this.fileContent = this.readFile(filePath);
    }
    private checkExtention(path: string) {
        console.log(path);
        const chunks = path.split('.');
        console.log(chunks);
        const ext = chunks[chunks.length - 1];
        if (ext !== 'xml') {
            throw new Error(
                `File extention was not provided or extention is incorrect.
                Acceptable extention is xml.
                Provided extention is "${ext}"`,
            );
        }
    }
    readFile(path: string): string {
        this.checkExtention(path);
        const fBuffer = fs.readFileSync(path);
        return fBuffer.toString();
    }
    async parseFile(): Promise<any | null> {
        const fileStructure = await xml2js.parseStringPromise(this.fileContent);
        this.parsedFile = fileStructure;
        return this.parsedFile;
    }

}
