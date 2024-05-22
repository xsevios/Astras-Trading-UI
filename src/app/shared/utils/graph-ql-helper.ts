import { DefaultTableFilters } from "../models/settings/table-settings.model";
import { GraphQlFilter, GraphQlFilters } from "../models/graph-ql.model";
import {
  BooleanOperationFilterInput,
  DateTimeOperationFilterInput,
  DecimalOperationFilterInput,
  InputMaybe,
  IntOperationFilterInput,
  StringOperationFilterInput
} from "../../../generated/graphql.types";
import { ZodArray, ZodLazy, ZodNullable, ZodObject, ZodOptional, ZodRawShape, ZodTypeAny } from "zod";
import {
  BooleanOperationFilterInputSchema,
  DateTimeOperationFilterInputSchema,
  DecimalOperationFilterInputSchema,
  IntOperationFilterInputSchema,
  StringOperationFilterInputSchema
} from "../../../generated/graphql.schemas";

interface FieldsMapping {
  [parentField: string]: string[];
}

enum FilterType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  Boolean = 'boolean'
}

enum IntervalModifier {
  From = 'From',
  To = 'To'
}

const DEFAULT_FILTER_KEYS = [
  'and',
  'or',
  'contains',
  'endsWith',
  'eq',
  'in',
  'ncontains',
  'nendsWith',
  'neq',
  'nin',
  'nstartsWith',
  'startsWith',
  'gt',
  'gte',
  'lt',
  'lte',
  'ngt',
  'ngte',
  'nlt',
  'nlte',
  'none',
  'all',
  'any',
  'some'
];

const DECIMAL_FILTER_SCHEMA_STRING = JSON.stringify(DecimalOperationFilterInputSchema().shape);
const INT_FILTER_SCHEMA_STRING = JSON.stringify(IntOperationFilterInputSchema().shape);
const STRING_FILTER_SCHEMA_STRING = JSON.stringify(StringOperationFilterInputSchema().shape);
const BOOLEAN_FILTER_SCHEMA_STRING = JSON.stringify(BooleanOperationFilterInputSchema().shape);
const DATE_FILTER_SCHEMA_STRING = JSON.stringify(DateTimeOperationFilterInputSchema().shape);

export class GraphQlHelper {
  static parseToGqlFiltersIntersection<T extends { and?: InputMaybe<T[]> }>(filters: DefaultTableFilters, schema: ZodObject<ZodRawShape>): T {
    const schemaKeys = this.zodKeys(schema);

    const reqFilters = Object.keys(filters)
      .map(f => {
        const foundFilter = schemaKeys.find(pf => {
          const nestedFields = pf.split('.');
          const filterName = nestedFields[nestedFields.length - 1].split('/')[0];

          return filterName === f ||
            filterName === f.replace(IntervalModifier.From, '') ||
            filterName === f.replace(IntervalModifier.To, '');
        });

        return { graphQlFilter: foundFilter, tableFilterKey: f };
      })
      .filter(fi => fi.graphQlFilter != null)
      .map(fi => this.getGraphQlFilter<T>(
        fi.tableFilterKey,
        filters[fi.tableFilterKey] as string | string[] | number | boolean,
        fi.graphQlFilter!
      ));

    return { and: reqFilters } as T;
  }

  // Parse applied filters to graphQL filters
  static parseFilters(filters: DefaultTableFilters, nestedFields: FieldsMapping, filterTypes: FieldsMapping): GraphQlFilters {
    const parsedFilters = Object.keys(filters)
      .filter(key =>
        filters[key] != null &&
        (
          (typeof filters[key] === 'number') ||
          (typeof filters[key] === 'boolean') ||
          (filters[key] as string | string[]).length > 0
        )
      )
      .reduce((acc, key) => {
        const parentField = Object.keys(nestedFields)
          .find(k =>
            key.endsWith('From')
              ? nestedFields[k].includes(key.replace('From', ''))
              : key.endsWith('To')
                ? nestedFields[k].includes(key.replace('To', ''))
                : nestedFields[k].includes(key)
          );

        if (parentField == null) {
          return acc;
        }

        const filterValue = this.getFilterValue(filterTypes, key, filters[key]!);

        if (filterValue == null) {
          return acc;
        }

        if (parentField === 'rootFields') {
          acc.push(filterValue);
        } else {
          acc.push({
            [parentField]: filterValue
          });
        }

        return acc;
      }, [] as (GraphQlFilter | GraphQlFilters)[]);

    return {
      and: parsedFilters
    };
  }

  private static getFilterValue(
    fieldTypes: FieldsMapping,
    filterName: string,
    filterValue: string | string[] | boolean | number
  ): GraphQlFilter | GraphQlFilters | null {
    const filterType = Object.keys(fieldTypes).find(key => fieldTypes[key].includes(filterName));

    if (filterType === 'multiSelect') {
      return {
        or: (filterValue as string[]).map(value => ({ [filterName]: { eq: value } }))
      };
    }

    if (filterType === 'interval') {
      if (filterName.includes('From')) {
        return { [filterName.replace('From', '')]: { gte: Number(filterValue) } };
      }
      return { [filterName.replace('To', '')]: { lte: Number(filterValue) } };
    }

    if (filterType === 'bool') {
      return { [filterName]: { eq: filterValue }};
    }

    if (filterType === 'date') {
      const [day, month, year] = (filterValue as string).split('.').map(d => +d);
      const filterDate = new Date(year, month - 1, day);

      if (isNaN(filterDate.getTime())) {
        return null;
      }

      const parsedDate = filterDate.toISOString();

      if (filterName.includes('From')) {
        return { [filterName.replace('From', '')]: { gte: parsedDate } };
      }
      return { [filterName.replace('To', '')]: { lte: parsedDate } };
    }

    return { [filterName]: { contains: filterValue }};
  }

  // get zod object keys recursively
  static getZodObject(schema: ZodTypeAny): ZodObject<any> | null {
    if (schema === null || schema === undefined) return null;
    if (schema instanceof ZodLazy) return this.getZodObject(schema.schema);
    if (schema instanceof ZodNullable || schema instanceof ZodOptional) return this.getZodObject(schema.unwrap());
    if (schema instanceof ZodArray) return this.getZodObject(schema.element);
    if (schema instanceof ZodObject) {
      return schema;
    }
    return null;
  };

  private static zodKeys(schema: ZodTypeAny): string[] {
    const zodObj = this.getZodObject(schema);

    if (zodObj == null) {
      return [];
    }

    // get key/value pairs from schema
    const entries = Object.entries(zodObj.shape);
    // loop through key/value pairs
    return entries
      .filter(([key]) => !DEFAULT_FILTER_KEYS.includes(key))
      .flatMap(([key, value]) => {
        // get nested keys
        const nested = (this.zodKeys(value as ZodTypeAny) ?? []).map(subKey => `${key}.${subKey}`);
        return nested.length ? nested : `${key}/${this.getFilterType(this.getZodObject(value as ZodTypeAny)?.shape ?? {})}`;
      });
  };

  private static getFilterType(shape: ZodRawShape): FilterType {
    switch (JSON.stringify(shape)) {
      case DECIMAL_FILTER_SCHEMA_STRING:
      case INT_FILTER_SCHEMA_STRING:
        return FilterType.Number;
      case STRING_FILTER_SCHEMA_STRING:
        return FilterType.String;
      case BOOLEAN_FILTER_SCHEMA_STRING:
        return FilterType.Boolean;
      case DATE_FILTER_SCHEMA_STRING:
        return FilterType.Date;
      default:
        return FilterType.String;
    }
  }

  private static getGraphQlFilter<T>(
    tableFilterName: string,
    tableFilterValue: string | string[] | number | boolean,
    graphQlFilter: string
    ): T {
    const filterType = graphQlFilter.split('/')[1] as FilterType;
    const nestedFilterKeys = graphQlFilter.split('/')[0].split('.');

    const intervalModifier = tableFilterName.endsWith(IntervalModifier.From)
      ? IntervalModifier.From
      : tableFilterName.endsWith(IntervalModifier.To)
        ? IntervalModifier.To
        : null;

    return nestedFilterKeys.reverse().reduce(
      (acc, curr, index) => {
        if (Array.isArray(tableFilterValue) && index === 0) {
          return {
            or: tableFilterValue.map(v => ({ [curr]: { eq: v } }))
          };
        }
        return { [curr]: acc };
      },
      this.getGraphQlFilterValue(filterType, tableFilterValue, intervalModifier)
    ) as T;
  }

  private static getGraphQlFilterValue(
    filterType: FilterType,
    filterValue: string | string[] | number | boolean,
    intervalModifier: IntervalModifier | null
    ): DecimalOperationFilterInput | DateTimeOperationFilterInput | BooleanOperationFilterInput | StringOperationFilterInput | IntOperationFilterInput | null {
    const conditionKey = intervalModifier == null
      ? 'eq'
      : intervalModifier === IntervalModifier.From
        ? 'gte'
        : 'lte';

    switch (filterType) {
      case FilterType.String:
        return { contains:  filterValue as string };
      case FilterType.Number:
        return { [conditionKey]: Number(filterValue as number) };
      case FilterType.Date:
        const [day, month, year] = (filterValue as string).split('.').map(d => +d);
        const filterDate = new Date(year, month - 1, day);

        if (isNaN(filterDate.getTime())) {
          return null;
        }

        const parsedDate = filterDate.toISOString();

        return { [conditionKey]: parsedDate };
      case FilterType.Boolean:
        return { eq: filterValue as boolean };
    }
  }
}
