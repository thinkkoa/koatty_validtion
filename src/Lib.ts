/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-03-19 20:42:09
 */
import helper from "think_lib";
import * as util from "util";
export const PARAM_TYPE_KEY = 'PARAM_TYPE_KEY';
export const PARAM_RULE_KEY = 'PARAM_RULE_KEY';
export const ENABLE_VALIDATED = "ENABLE_VALIDATED";

export const paramterTypes: any = {
    "Number": 1, "number": 1, "String": 1,
    "string": 1, "Boolean": 1, "boolean": 1,
    "Array": 1, "array": 1, "Tuple": 1, "tuple": 1,
    "Object": 1, "object": 1, "Enum": 1, "enum": 1
};

const functionPrototype = Object.getPrototypeOf(Function);
// get property of an object
// https://tc39.github.io/ecma262/#sec-ordinarygetprototypeof
function ordinaryGetPrototypeOf(obj: any): any {
    const proto = Object.getPrototypeOf(obj);
    if (typeof obj !== "function" || obj === functionPrototype) {
        return proto;
    }

    // TypeScript doesn't set __proto__ in ES5, as it's non-standard.
    // Try to determine the superclass constructor. Compatible implementations
    // must either set __proto__ on a subclass constructor to the superclass constructor,
    // or ensure each class has a valid `constructor` property on its prototype that
    // points back to the constructor.

    // If this is not the same as Function.[[Prototype]], then this is definately inherited.
    // This is the case when in ES6 or when using __proto__ in a compatible browser.
    if (proto !== functionPrototype) {
        return proto;
    }

    // If the super prototype is Object.prototype, null, or undefined, then we cannot determine the heritage.
    const prototype = obj.prototype;
    const prototypeProto = prototype && Object.getPrototypeOf(prototype);
    // tslint:disable-next-line: triple-equals
    if (prototypeProto == undefined || prototypeProto === Object.prototype) {
        return proto;
    }

    // If the constructor was not a function, then we cannot determine the heritage.
    const constructor = prototypeProto.constructor;
    if (typeof constructor !== "function") {
        return proto;
    }

    // If we have some kind of self-reference, then we cannot determine the heritage.
    if (constructor === obj) {
        return proto;
    }

    // we have a pretty good guess at the heritage.
    return constructor;
}

/**
 * get property matadata data
 *
 * @param {(string | symbol)} decoratorNameKey
 * @param {*} target
 * @returns
 */
function listPropertyData(decoratorNameKey: string | symbol, target: any, propertyKey: string | symbol) {
    const originMap = getOriginMetadata(decoratorNameKey, target, propertyKey);
    const datas: any = {};
    for (const [key, value] of originMap) {
        datas[key] = value;
    }
    return datas;
}

/**
 * get metadata value of a metadata key on the prototype chain of an object and property
 * @param metadataKey metadata's key
 * @param target the target of metadataKey
 */
export function recursiveGetMetadata(metadataKey: any, target: any, propertyKey?: string | symbol): any[] {
    // get metadata value of a metadata key on the prototype
    // let metadata = Reflect.getOwnMetadata(metadataKey, target, propertyKey);
    const metadata = listPropertyData(metadataKey, target, propertyKey) || {};

    // get metadata value of a metadata key on the prototype chain
    let parent = ordinaryGetPrototypeOf(target);
    while (parent !== null) {
        // metadata = Reflect.getOwnMetadata(metadataKey, parent, propertyKey);
        const pmetadata = listPropertyData(metadataKey, parent, propertyKey);
        if (pmetadata) {
            for (const n in pmetadata) {
                if (!metadata.hasOwnProperty(n)) {
                    metadata[n] = pmetadata[n];
                }
            }
        }
        parent = ordinaryGetPrototypeOf(parent);
    }
    return metadata;
}

/**
 * Dynamically add methods for target class types
 *
 * @param {Function} clazz
 * @param {string} protoName
 * @param {Function} func
 */
export function defineNewProperty(clazz: Function, protoName: string, func: Function) {
    const oldMethod = Reflect.get(clazz.prototype, protoName);
    if (oldMethod) {
        Reflect.defineProperty(clazz.prototype, protoName, {
            writable: true,
            value: function fn(...props: any[]) {
                // process paramter
                props = func(props);
                // tslint:disable-next-line: no-invalid-this
                return Reflect.apply(oldMethod, this, props);
            }
        });
    }
}

/**
 *
 *
 * @param {(string | symbol)} metadataKey
 * @param {*} target
 * @param {(string | symbol)} [propertyKey]
 * @returns
 */
export function getOriginMetadata(metadataKey: string | symbol, target: any, propertyKey?: string | symbol) {
    // filter Object.create(null)
    if (typeof target === "object" && target.constructor) {
        target = target.constructor;
    }
    if (propertyKey) {
        // for property or method
        if (!Reflect.hasMetadata(metadataKey, target, propertyKey)) {
            Reflect.defineMetadata(metadataKey, new Map(), target, propertyKey);
        }
        return Reflect.getMetadata(metadataKey, target, propertyKey);
    } else {
        // for class
        if (!Reflect.hasMetadata(metadataKey, target)) {
            Reflect.defineMetadata(metadataKey, new Map(), target);
        }
        return Reflect.getMetadata(metadataKey, target);
    }
}

/**
 * Convert paramer's type to defined.
 *
 * @param {*} param
 * @param {string} type
 * @returns
 */
export const convertParamsType = (param: any, type: string) => {
    switch (type) {
        case "Number":
        case "number":
            if (helper.isNaN(param)) {
                return NaN;
            }
            if (helper.isNumberString(param)) {
                return helper.toNumber(param);
            }
            if (helper.isNumber(param)) {
                return param;
            }
            return NaN;
        case "Boolean":
        case "boolean":
            return !!param;
        case "Array":
        case "array":
        case "Tuple":
        case "tuple":
            if (helper.isArray(param)) {
                return param;
            }
            return helper.toArray(param);
        case "String":
        case "string":
            if (helper.isString(param)) {
                return param;
            }
            return helper.toString(param);
        // case "object":
        // case "enum":
        default: //any
            return param;
    }
};

/**
 * Check the base types.
 *
 * @param {*} value
 * @param {string} type
 * @returns {*}
 */
export const checkParamsType = function (value: any, type: string): any {
    switch (type) {
        case "Number":
        case "number":
            if (!helper.isNumber(value) || helper.isNaN(value)) {
                return false;
            }
            return true;
        case "Boolean":
        case "boolean":
            if (!helper.isBoolean(value)) {
                return false;
            }
            return true;
        case "Array":
        case "array":
        case "Tuple":
            if (!helper.isArray(value)) {
                return false;
            }
            return true;
        case "String":
        case "string":
            if (!helper.isString(value)) {
                return false;
            }
            return true;
        case "Object":
        case "object":
        case "Enum":
            if (helper.isUndefined(value)) {
                return false;
            }
            return true;
        default: //any
            return true;
    }
};


/**
 *
 *
 * @export
 * @param {*} clazz
 * @param {*} data
 * @param {boolean} [convert=false]
 * @returns
 */
export function plainToClass(clazz: any, data: any, convert = false) {
    const originMap = getOriginMetadata(PARAM_TYPE_KEY, clazz);
    if (helper.isClass(clazz)) {
        const cls = Reflect.construct(clazz, []);
        if (!helper.isObject(data)) {
            data = {};
        }
        for (const [key, value] of originMap) {
            if (key && Object.prototype.hasOwnProperty.call(data, key)) {
                if (convert) {
                    cls[key] = convertParamsType(data[key], value);
                } else {
                    cls[key] = data[key];
                    if (!checkParamsType(cls[key], value)) {
                        const err: any = new Error(`TypeError: invalid arguments '${key}'.`);
                        err.code = 400;
                        err.status = 400;
                        throw err;
                    }
                }
            }
        }
        return cls;
    }
    return data;
}

/**
 * Checks if value is a chinese name.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function cnname(value: string): boolean {
    const reg = /^([a-zA-Z0-9\u4e00-\u9fa5\·]{1,10})$/;
    return reg.test(value);
}

/**
 * Checks if value is a idcard number.
 *
 * @param {string} value
 * @returns
 */
export function idnumber(value: string): boolean {
    if (/^\d{15}$/.test(value)) {
        return true;
    }
    if ((/^\d{17}[0-9X]$/).test(value)) {
        const vs = '1,0,x,9,8,7,6,5,4,3,2'.split(',');
        const ps: any[] = '7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2'.split(',');
        const ss: any[] = value.toLowerCase().split('');
        let r = 0;
        for (let i = 0; i < 17; i++) {
            r += ps[i] * ss[i];
        }
        const isOk = (vs[r % 11] === ss[17]);
        return isOk;
    }
    return false;
}

/**
 * Checks if value is a mobile phone number.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function mobile(value: string): boolean {
    const reg = /^(13|14|15|16|17|18|19)\d{9}$/;
    return reg.test(value);
}

/**
 * Checks if value is a zipcode.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function zipcode(value: string): boolean {
    const reg = /^\d{6}$/;
    return reg.test(value);
}

/**
 * Checks if value is a platenumber.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function platenumber(value: string): boolean {
    // let reg = new RegExp('^(([\u4e00-\u9fa5][a-zA-Z]|[\u4e00-\u9fa5]{2}\d{2}|[\u4e00-\u9fa5]{2}[a-zA-Z])[-]?|([wW][Jj][\u4e00-\u9fa5]{1}[-]?)|([a-zA-Z]{2}))([A-Za-z0-9]{5}|[DdFf][A-HJ-NP-Za-hj-np-z0-9][0-9]{4}|[0-9]{5}[DdFf])$');
    // let xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
    const xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
    // let creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
    const creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
    if (value.length === 7) {
        return creg.test(value);
    } else {
        //新能源车牌
        return xreg.test(value);
    }
}
