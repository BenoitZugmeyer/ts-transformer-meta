# ts-transformer-meta

Experimental TypeScript transformer to access meta informations for a type.

```ts
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
```

## Setup

Configure your build process:

- [webpack / ts-loader](https://github.com/TypeStrong/ts-loader#getcustomtransformers--program-program---before-transformerfactory-after-transformerfactory--)
- [webpack / awesome-typescript-loader](https://github.com/s-panferov/awesome-typescript-loader#getcustomtransformers-string--program-tsprogram--tscustomtransformers--undefined-defaultundefined)
- [rollup / rollup-plugin-typescript2](https://github.com/ezolenko/rollup-plugin-typescript2#plugin-options)

Or use [ttypescript](https://github.com/cevek/ttypescript).

Custom transformers object:

```js
{
  before: [keysTransformer(program)]
}
```

See the [example](example) for a configuration example.

## Acknowledgement

All credits go to Kimamula with his projects [ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys) and [ts-transformer-enumerate](https://github.com/kimamula/ts-transformer-enumerate).
