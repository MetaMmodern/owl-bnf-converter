import Parser from './owlParser';

const fPath = './examples/myowl.xml';
const parser = new Parser(fPath);

parser.parseFile().then((data) => {
    console.log(data);
});
