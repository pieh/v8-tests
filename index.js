const v8 = require("v8");
const chalk = require("chalk");
const stringify = require(`json-stringify-safe`);
const _typeof = require(`typeof`);
const _ = require("lodash");

const serializers = {
  v8: {
    serialize: v8.serialize,
    deserialize: v8.deserialize
  },
  json: {
    serialize: stringify,
    deserialize: JSON.parse
  }
};

var Prototype = function() {
  this.member = "test";
};
Prototype.prototype.method = function() {
  return this.member;
};

const values = {
  string: "test",
  date: new Date(),
  number: 5,
  float: 5.5,
  bool: true,
  symbol: Symbol("test"),
  fn: () => "test",
  undefined: undefined,
  object: { foo: "bar" },
  array: ["test"],
  Error: new Error("test"),
  Regexp: /foo/,
  Set: new Set(["test"]),
  Map: new Map([["index", "value"]]),
  promise: new Promise(resolve => {}),
  prototypedObj: new Prototype()
};

const inspect = Symbol.for("nodejs.util.inspect.custom");
class Crash {
  [inspect]() {
    return chalk.bold(chalk.red("CRASH"));
  }
}

class RedCross {
  [inspect]() {
    return chalk.bold(chalk.red("✗"));
  }
}

class GreenCheckMark {
  [inspect]() {
    return chalk.bold(chalk.green("✓"));
  }
}

const Fail = new RedCross();
const Success = new GreenCheckMark();
const Crashed = new Crash();

const prettify = val => (val ? Success : Fail);

console.log(Fail);
const results2 = Object.entries(values).reduce((valAcc, [type, value]) => {
  valAcc[type] = Object.entries(serializers).reduce(
    (acc, [label, { serialize, deserialize }]) => {
      // if (value) {
      acc.value = value;

      if (value instanceof Error) {
        // multiline breaks tables
        acc.value = value.toString();
      }
      acc.type = _typeof(value);

      try {
        const s = (acc[`${label} - serialized`] = serialize(value));
        try {
          let d;
          if (typeof s !== "undefined") {
            d = acc[`${label} - deserialized`] = deserialize(s);
          }
          acc[`${label} - type`] = _typeof(d);
        } catch (e) {
          acc[`${label} - deserialized`] = Crashed;
          acc[`${label} - type`] = Crashed;
          acc[`${label} - error`] = e.message;
        }
      } catch (e) {
        acc[`${label} - serialized`] = Crashed;
        acc[`${label} - deserialized`] = Crashed;
        acc[`${label} - type`] = Crashed;
        acc[`${label} - error`] = e.message;
      }

      const sameType = acc.type === acc[`${label} - type`];
      const sameValue = _.isEqual(value, acc[`${label} - deserialized`]);

      acc[`${label} - same type`] = prettify(sameType);
      acc[`${label} - same value`] = prettify(sameValue);
      acc[`${label} - same`] = prettify(sameType && sameValue);
      return acc;
    },
    {}
  );
  return valAcc;
}, {});

console.table(results2, [
  "v8 - same value",
  "v8 - deserialized",
  "value",
  "json - deserialized",
  "json - same value"
]);

console.table(results2, [
  "value",
  "v8 - same type",
  "v8 - type",
  "type",
  "json - type",
  "json - same type"
]);

console.table(results2, ["v8 - serialized", "value", "json - serialized"]);
console.table(results2, ["v8 - error", "value", "json - error"]);
