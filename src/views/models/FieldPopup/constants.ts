import {Constraint, Field} from '../../../types/types'
export const fieldTypes = [
  'String',
  'Int',
  'Boolean',
  'Float',
  'DateTime',
  'Enum',
  'Json',
]

export const mockConstraints: Constraint[] = [
  {
    type: 'REGEX',
    value: '/hallo/gi',
  },
  {
    type: 'CONTAINS',
    value: '#graphcool',
  },
  {
    type: 'STARTS_WITH',
    value: 'gra',
  },
  {
    type: 'ENDS_WITH',
    value: 'ool',
  },
  {
    type: 'EQUALS',
    value: 'awesomeness',
  },
  {
    type: 'LENGTH',
    lengthOperator: 'GT',
    value: '17',
  },
]

export const emptyField: Field = {
  id: '',
  name: '',
  description: '',
  typeIdentifier: undefined,
  isRequired: false,
  isList: false,
  enumValues: [],
  defaultValue: undefined,
  migrationValue: undefined,
  isUnique: true,
  constraints: mockConstraints, // TODO add real data when backend is ready
}

export const mockField: Field = {
  id: '',
  name: 'someFunnyField',
  description: 'Yeah, so this is a field',
  typeIdentifier: 'String',
  isRequired: true,
  isList: false,
  enumValues: [],
  defaultValue: undefined,
  migrationValue: undefined,
  isUnique: false,
  constraints: mockConstraints, // TODO add real data when backend is ready
}
