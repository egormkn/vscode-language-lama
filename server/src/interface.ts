interface Fun {
  name: string;
}

interface Var {
  name: string;
}

interface Import {
  unit: string;
}

interface Infix {
  associativity: "left" | "right" | "none";
  operator: string;
  location: {
    mode: "at" | "after" | "before";
    operator: string;
  };
}

type Interface = (Fun | Var | Import | Infix)[]

export { Fun, Var, Import, Infix, Interface }
