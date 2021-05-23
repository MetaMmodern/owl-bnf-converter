import { type } from 'os';
import Parser from './owlParser';
const fs = require('fs');
const fPath = './examples/myowl.xml';
const parser = new Parser(fPath);


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
        return this.populateName() + `: '{' '${this.input}' '${this.name}' ${this.output}ID '}';`;
    }
    
}

class Entity {
    name: string
    relations = new Array();
    constructor(name: string) {
        this.name = name;
    }
    addRelation(relation :Relation){
        this.relations.push(relation);
    }
    populateGrammarLine() : string {
        let all_relations = this.relations.map(el => el.populateName()).join(', ');
        return `${this.name} : ${this.name} '{' ${this.relations.length > 1 ? "[ " + all_relations + "]" : ''} '}';`;
    }
}

const populateEntitiesString = (entities : Entity[] ) : string => {
    return `thing: Thing '{' (${entities.map(el => el.name).join("|")}) '}';`
}

// create string from tree
const populateGrammar = (entities : Entity[] ) : string => {
    let grammar = new Array();
    grammar.push(populateEntitiesString(entities));
    
    entities.forEach(el => 
        {
            grammar.push(el.populateGrammarLine())
            el.relations.forEach(relation => {
                grammar.push(relation.populateGrammarLine())
            })
        })
    return grammar.join('\n');
}


const writeToFile = (fileName: string, result : string) => {

    fs.writeFile(fileName, result,  function(err: any) {
        if (err) {
            return console.error(err);
        }
        console.log("Grammar file created!");
    });
}



let mapClass = new Map();
let mapRelation = new Map();
let typeSwitcher = new Map();
let allowedNameSpace = new Array();

let entitySplitter = (name: string, splitChar: string, isEntity : boolean) => {
    let clearName = name.split(splitChar)[1];
    return isEntity ? new Entity(clearName) : clearName;
}


// add variatives to read class path atribute
mapClass.set("IRI", (name: string) => {
    return entitySplitter(name, "#", true);
})
mapClass.set("abbreviatedIRI", (name: string) => {
    return entitySplitter(name, ":", true)
})


mapRelation.set("IRI", (name: string,isConstructor: boolean, parent: string, child: string) => {
    let clearName = name.split('#')[1];
    // push to allowed namespaced or return complited relation
    return  isConstructor ? new Relation(clearName, parent, child) : allowedNameSpace.push(clearName);
})

// map valients with different structure types
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
                subclass['$'][Object.keys(subclass['$'])[0]], false);
           result instanceof Entity ? dec.set(result.name, result) : undefined;
        });
    });    


    relations.forEach((element : any) => {
        let parentMap = typeSwitcher.get("Class")
        let path = Object.keys(element.Class[0].$)[0];
        let parent =  parentMap.get(path)(element.Class[0].$[path], false)
        // get our parent from already descripted
        let entity = dec.get(parent.name);
        
        let atributesFunction = typeSwitcher.get("ObjectAllValuesFrom");

       // get relation with input and output type
       let  relation = atributesFunction(parent.name, element.ObjectAllValuesFrom[0])
       entity.addRelation(relation);
       dec.set(entity.name, entity)

    });

    writeToFile('grammar.txt',populateGrammar([...dec.values()]));
});



