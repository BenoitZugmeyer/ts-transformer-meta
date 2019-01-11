import * as ts from "typescript"

export interface PropertyMeta {
  name: string
  value: Meta
  optional: boolean
}

export interface Meta {
  flags: ts.TypeFlags

  // For Interface or Class types
  objectFlags?: ts.ObjectFlags
  properties?: PropertyMeta[]

  // For Union or Intersection types
  types?: Meta[]

  // For literal types
  value?: number | string
}
export function meta<T>(): Meta {
  return (null as any) as Meta
}
