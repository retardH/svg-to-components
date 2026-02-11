/**
 * Type declarations for SVGO internal modules
 */

declare module "svgo/lib/parser.js" {
  import type { XastRoot } from "svgo/lib/types.js";
  const parser: {
    parseSvg(svg: string): XastRoot;
  };
  export default parser;
}

declare module "svgo/lib/types.js" {
  export interface XastRoot {
    type: "root";
    children: XastChild[];
  }

  export interface XastElement {
    type: "element";
    name: string;
    attributes: Record<string, string>;
    children: XastChild[];
  }

  export interface XastText {
    type: "text";
    value: string;
  }

  export interface XastComment {
    type: "comment";
    value: string;
  }

  export interface XastCdata {
    type: "cdata";
    value: string;
  }

  export interface XastDoctype {
    type: "doctype";
    name: string;
    data: {
      doctype: string;
    };
  }

  export interface XastInstruction {
    type: "instruction";
    name: string;
    value: string;
  }

  export type XastChild =
    | XastElement
    | XastText
    | XastComment
    | XastCdata
    | XastDoctype
    | XastInstruction;
}
