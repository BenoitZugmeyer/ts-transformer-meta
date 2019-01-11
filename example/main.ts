import { meta } from "ts-transformer-meta"

interface Foo {
  bar: number
}

const properties = meta<Foo>().properties
if (properties) {
  console.log(properties.map(property => property.name)) // ["bar"]
}

enum Alpha {
  A,
  B,
  C,
}

const types = meta<Alpha>().types
if (types) {
  console.log(types.map(type => type.value)) // [0, 1, 2]
}
