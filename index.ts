import { type } from 'os';
import Parser from './owlParser';

const fPath = './examples/myowl.xml';
const parser = new Parser(fPath);

let records = []

class Relation {
    name: string
    input: string
    output: string
    constructor(name: string, input: string, output: string) {
        this.name = name;
        this.input = input;
        this.output = output;
    }
    populateName(): string {
        return  `${this.input}_${this.name}_${this.output}`
    }
    populateGrammarLine(): string{
        return this.populateName() + `: '{' '${this.input}' '${this.name}' ${this.output}ID '}' `;
    }
    
}

class Entity {
    name: string
    private relations = new Array();
    constructor(name: string) {
        this.name = name;
    }
    addRelation(relation :Relation){
        this.relations.push(relation);
    }
    populateGrammarLine() : string {
        return `${this.name} : ${this.name} '{' [${this.relations.forEach(el => el.name)}] '}'`;
    }
}

let mapClass = new Map();
let mapRelation = new Map();
let typeSwitcher = new Map();
let allowedNameSpace = new Array();

mapClass.set("IRI", (name: string) :Entity  => {
    return new Entity(name.split('#')[1]);
})
mapClass.set("abbreviatedIRI", (name: string) : Entity => {
    return new Entity(name.split(':')[1]);
})

mapRelation.set("IRI", (name: string,isConstructor: boolean, parent: string, child: string) => {
    return  isConstructor ? new Relation(name.split('#')[1], parent, child) : allowedNameSpace.push(name.split('#')[1]);
})

typeSwitcher.set("Class", mapClass);
typeSwitcher.set("ObjectAllValuesFrom", (name: string ,arr: any ) : Relation => {
    // class
    let key = Object.keys(arr.Class[0].$)[0];
    let child = mapClass.get(key)(arr.Class[0].$[key]) 
    // property
    key = Object.keys(arr.ObjectProperty[0].$)[0];
    let relation = mapRelation.get(key)(arr.ObjectProperty[0].$[key], true, name, child.name);
    return relation;    
})
typeSwitcher.set("ObjectProperty", mapRelation);

let dec = new Map();

parser.parseFile().then((data) => {
    const declarations = data['Ontology'][ 'Declaration'];
    const relations = data['Ontology'][ 'SubClassOf'];
    
    declarations.forEach((element: any) => {
        let name  = Object.keys(element)[0];
        let currentMap = typeSwitcher.get(name);
        element[name].forEach( (subclass : any) => {
           let result = currentMap.get(Object.keys(subclass['$'])[0])(
                subclass['$'][Object.keys(subclass['$'])[0]], false
           );
           result ? dec.set(result.name, result) : undefined;
        });
    });    

    // dec.forEach(el => console.log(el));
    // allowedNameSpace.forEach(el => console.log(el));

    relations.forEach((element : any) => {
        let parentMap = typeSwitcher.get("Class")
        let path = Object.keys(element.Class[0].$)[0];
        let parent =  parentMap.get(path)(element.Class[0].$[path])
        // get our parent from already descripted
        let entity = dec.get(parent.name);
        
        let atributesFunction = typeSwitcher.get("ObjectAllValuesFrom");

        // get relation with input and output type
        let  relation = atributesFunction(parent.name, element.ObjectAllValuesFrom[0])
       entity.addRelation(relation);
       dec.set(entity.name, entity)

    });
    dec.forEach(el => console.log(el));
});
