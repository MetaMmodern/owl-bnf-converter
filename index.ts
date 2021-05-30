import Parser from './fileParser';
import writer from './grammarWriter';
import parseOwl from './owlParser';
const fPath = './examples/myowl3.xml';
const parser = new Parser(fPath);

parser.parseFile().then((data) => {
    const res = parseOwl(data);
    writer(res);
});
