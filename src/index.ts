/**
 * @ author: richen
 * @ copyright: Copyright (c) - <richenlin(at)gmail.com>
 * @ license: MIT
 * @ version: 2020-03-20 11:31:09
 */
import * as helper from "koatty_lib";
import { ValidRules } from './util';
import { PARAM_RULE_KEY, PARAM_CHECK_KEY } from './lib';
import { IOCContainer } from 'koatty_container';

// export for manual verification
export { checkParams, checkParamsType, convertParamsType, paramterTypes, plainToClass, PARAM_TYPE_KEY, PARAM_RULE_KEY, PARAM_CHECK_KEY } from "./lib";
export * from "./util";
// export decorators from class-validator
// export { IsHash } from "class-validator";

/**
 * Validation parameter's type and values.
 *
 * @export
 * @param {(ValidRules | ValidRules[] | Function)} rule
 * @param {string} [message]
 * @returns {ParameterDecorator}
 */
export function Valid(rule: ValidRules | ValidRules[] | Function, message?: string): ParameterDecorator {
    let rules: any = [];
    if (helper.isString(rule)) {
        rules = (<string>rule).split(",");
    } else {
        rules = rule;
    }
    return (target: any, propertyKey: string, descriptor: any) => {
        // 获取成员参数类型
        const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
        const type = (paramTypes[descriptor] && paramTypes[descriptor].name) ? paramTypes[descriptor].name : "object";

        IOCContainer.attachPropertyData(PARAM_RULE_KEY, {
            name: propertyKey,
            rule: rules,
            message,
            index: descriptor,
            type
        }, target, propertyKey);
    };
}

/**
 * Validation parameter's type and values from DTO class.
 *
 * @export
 * @returns {MethodDecorator}
 */
export function Validated(): MethodDecorator {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        //
        IOCContainer.savePropertyData(PARAM_CHECK_KEY, {
            dtoCheck: 1
        }, target, propertyKey);

        // 获取成员参数类型
        // const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];

        // const { value, configurable, enumerable } = descriptor;
        // descriptor = {
        //     configurable,
        //     enumerable,
        //     writable: true,
        //     value: async function valid(...props: any[]) {
        //         const ps: any[] = [];
        //         // tslint:disable-next-line: no-unused-expression
        //         (props || []).map((value: any, index: number) => {
        //             const type = (paramTypes[index] && paramTypes[index].name) ? paramTypes[index].name : "any";
        //             if (!paramterTypes[type]) {
        //                 ps.push(ClassValidator.valid(paramTypes[index], value, true));
        //             } else {
        //                 ps.push(Promise.resolve(value));
        //             }
        //         });
        //         if (ps.length > 0) {
        //             props = await Promise.all(ps);
        //         }
        //         // tslint:disable-next-line: no-invalid-this
        //         return value.apply(this, props);
        //     }
        // };
        // return descriptor;
    };
}
