import * as config from 'config';
import { Location, buildCheckFunction } from 'express-validator';
import { Request, NextFunction, Response } from 'express';

export type paginationOrder = 'ASC' | 'DESC';
export interface PaginationValidatorParams {
    orderDefault?: paginationOrder;
    locationIn?: Location;
    locationOut?: Location;
    defaultPage?: number;
    maxPageSize?: number;
    defaultPageSize?: number;
}

export interface Paginatable {
    page: number;
    pageSize: number;
    order: paginationOrder;
}


export const paginate = (page: number, pageSize: number) => {
    const offset = (page-1) * pageSize;
    return {
        offset,
        limit: pageSize,
    };
};
export const safePaginate = (page: any, pageSize: any) => {
    const pageParsed = parseInt(page);
    const pageSizeParsed = parseInt(pageSize);
    const correctPage: number = (isFinite(pageParsed) && pageParsed > 0) ? pageParsed : 1;
    const correctPageSize: number = (isFinite(pageSizeParsed) && pageSizeParsed > 0) ? pageSizeParsed : config.get('defaultPageSize');
    const pager = paginate(
        correctPage,
        correctPageSize,
    );
    return {
        ...pager,
        page: correctPage,
        pageSize: correctPageSize,
    }
};

export const paginationValidator = ({ 
    orderDefault = 'ASC', locationIn = 'query', locationOut = 'query', 
    defaultPage = 1, defaultPageSize = 10, maxPageSize = 30
}: PaginationValidatorParams = {}) => {
    const fn = buildCheckFunction([ locationIn ]);

    return [
        fn('page')
            .optional()
            .isInt({ gt: 0 }).bail().withMessage('notValid')
            .toInt(),
        fn('pageSize')
            .optional()
            .isInt({ gt: 0, max: maxPageSize }).bail().withMessage('invalidValue')
            .toInt(),
        fn('order')
            .optional()
            .isInt({min: -1, max: 1}).bail().withMessage('notValid')
            .toInt(),
        async (req: Request, {}: Response, next: NextFunction) => {
            const { page, pageSize, order } = req[locationIn];
            const out = req[locationOut];

            out.page = page || defaultPage || 1;
            out.pageSize = pageSize || defaultPageSize || 10;
            out.order = typeof order == 'number' ? (order < 0 ? 'DESC' : 'ASC') : orderDefault;

            next();
        },
    ];
}