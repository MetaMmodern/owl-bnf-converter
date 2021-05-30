import * as fs from 'fs';

const writeToFile = (fileName: string, result: string) => {
    fs.writeFile(fileName, result, function (err: any) {
        if (err) {
            return console.error(err);
        }
        console.log('Grammar file created!');
    });
};
export default function writer(data: any) {
    writeToFile('grammar.txt', data);
}
