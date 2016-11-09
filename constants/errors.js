'use strict';

const xapiErrorLevels = Object.freeze({
  MAY_VIOLATION:    'MAY_VIOLATION',
  MUST_VIOLATION:   'MUST_VIOLATION',
  SHOULD_VIOLATION: 'SHOULD_VIOLATION'
});

const xapiValidationErrors = Object.freeze({
  UNEXPECTED:                                       'Unexpected property not permitted',
  MUST_BE_STRING:                                   'property, if present, must be a string.',
  MUST_BE_PRESENT:                                  'property was required to be a string but was absent.',
  MUST_BE_URI_STRING:                               'property, if present, must be a URI string.',
  MUST_BE_URI_PRESENT:                              'property was required to be a URI string but was absent.',
  MUST_BE_IRI_STRING:                               'property, if present, should be a IRI-like absolute URI per RFC 3987.',
  MUST_BE_BOOLEAN:                                  'property, if present, must be a Boolean.',
  MUST_BE_BOOLEAN_PRESENT:                          'property was required to be a Boolean but was absent.',
  MUST_BE_NUMBER:                                   'property, if present, must be a Number.',
  MUST_BE_NUMBER_PRESENT:                           'property was required to be a Number but was absent.',
  MUST_BE_MBOX_URI:                                 'mbox property was required to be a mailto URI string but was not a string at all.',
  MUST_BE_VALID_MBOX_FORMAT:                        'mbox property was required to be a mailto URI string but did not match the mailto format.',
  EXTENSIONS_MUST_NOT_BE_NULL:                      'If present, the extensions property must be a non-null map object.',
  LANGUAGE_MAPS_MUST_NOT_BE_NULL:                   'Language Maps, when present, must be non-null map objects',
  LANGUAGE_MAP_KEY_INVALID:                         'key, Language does not conform to RFC 5646',
  LANGUAGE_MAP_KEY_MUST_BE_STRING:                  'key: Language Map value should be a String, but was not',
  VERB_MUST_BE_PROVIDED:                            'Verb must be provided',
  VERB_MUST_NOT_BE_NULL:                            'Verb property value must a non-null map object.',
  DISPLAY_SHOULD_BE_PROVIDED:                       '"display" property should be provided.',
  INTERACTION_ACTIVITY_SHOULD_HAVE:                 'Interaction Activity Definitions should have a type property of',
  INTERACTION_COMPONENT_SHOULD_BE_ARRAY:            'This interaction component collection property should be an array.',
  INTERACTION_COMPONENT_MUST_NOT_BE_NULL:           'This interaction component collection member must be a non-null map object',
  INTERACTION_TYPE_MUST_BE_CMI:                     'If present, the "interactionType" value must be a CMI interaction type option.',
  ID_MUST_BE_UNIQUE:                                '"id" properties must be unique within each interaction component array',
  ID_SHOULD_NOT_CONTAIN_WHITESPACES:                '"id" properties on interaction components should not contain whitespace',
  INTERACTION_TYPE_MUST_BE_VALID:                   'This interaction component collection property is not associated with the present interactionType of: ',
  DEFINITIONS_MUST_BE_OBJECTS:                      '"definitions", when present, must be map objects',
  CORRECT_RESPONSES_PATTERN_MUST_BE_ARRAY:          'If present, the "correctResponsesPattern" value must be an Array of strings.',
  CORRECT_RESPONSES_PATTERN_MUST_BE_STRINGS:        '"correctResponsesPattern" items must be strings.',
  ACTIVITIES_MUST_NOT_BE_NULL_MAP_OBJECTS:          'Activities must be non-null map objects',
  STATEMENT_REF_MUST_NOT_BE_NULL_MAP_OBJECTS:       'StatementRef instances must be non-null map objects',
  OBJECT_TYPE_MUST_BE_STATEMENT_REF:                '"objectType" property value must be "StatementRef" for statement reference objects.',
  ID_MUST_BE_VALID_UUID_REF:                        '"id" property value must be a valid UUID string for statement reference objects.',
  SCALED_MUST_BE_BETWEEN_0_1:                       'If present, the scaled property value must be between 0 and 1',
  RAW_MUST_BE_GREATER_THAN_MIN:                     'If both "raw" and "min" are present, the raw property value should be greater than min',
  MAX_MUST_BE_GREATER_THAN_MIN:                     'If both "max" and "min" are present, the max property value should be greater than min',
  RAW_MUST_BE_LESS_THAN_MAX:                        'If both "raw" and "max" are present, the raw property value should be less than max',
  RESULT_MUST_BE_MAP_OBJECT:                        'If present, the result must be a map object',
  DURATION_MUST_BE_VALID:                           'If present, the "duration" property value must be an ISO 8601 duration',
  DATE_SHOULD_INCLUDE_ZONE_INFORMATION:             'ISO 8601 date time strings used in the xAPI should include time zone information.',
  DATE_MUST_BE_VALID:                               'This propertys string value must be conformant to ISO 8601 for Date Times.',
  VERSION_MUST_COMPLY_SEMANTIC_VERSIONING:          '"version" must be a non-null string that complies with Semantic Versioning 1.0.0',
  ATTACHMENTS_MUST_NOT_BE_NULL_MAP_OBJECTS:         '"attachment" instances must be non-null map objects.',
  LENGTH_MUST_BE_INTEGER:                           '"length" property must be provided with an integer value',
  SHA2_MUST_BE_PROVIDED_ON_ATTACHMENT_OBJECTS:      '"sha2" property must be provided on attachment objects',
  SHA2_MUST_CONTAIN_BASE_64_STRING:                 '"sha2" property must contain a string with base64 contents',
  ATTACHMENTS_MUST_BE_NOT_NULL_ARRAY:               '"attachments" must be a non-null Array.',
  AGENT_MUST_BE_NON_NULL_MAP_OBJECT:                '"agent" must be a non-null map object',
  AGENT_IFI_PROPERTIES_MUST_BE_SPECIFIED:           'Exactly one Inverse Functional Identifier property must be specified for an "agent".',
  AGENT_MUST_NOT_HAVE_GROUP_CHARACTERISTICS:        'Invalid object with characteristics of a Group when an Agent was expected.',
  GROUP_MUST_BE_NON_NULL_MAP_OBJECT:                '"group" must be a non-null map object',
  MEMBER_MUST_BE_PROVIDED_FOR_ANONYMOUS_GROUPS:     '"member" property must be provided for Anonymous Groups.',
  GROUP_IFI_PROPERTIES_MUST_BE_SPECIFIED:           'Exactly one Inverse Functional Identifier property must be specified for a "group".',
  GROUP_MEMBER_MUST_BE_ARRAY:                       'If present, the member property of a Group must be an Array',
  ACTOR_MUST_BE_PROVIDED:                           'Actor must be provided.',
  AUTHORITY_MUST_BE_NON_NULL_MAP_OBJECT:            'If present, the "authority" property must be a non-null map object.',
  GROUP_AUTHORITY_AGENT_MEMBERS_MUST_BE_TWO:        'If used as a Group, the "authority" property must contain a "member" property that is an array containing exactly two Agent objects.',
  CONTEXT_ACTIVITIES_MUST_NOT_BE_NULL:              '"Context Activities" property values must not be null.',
  CONTEXT_ACTIVITIES_SHOULD_BE_AN_ARRAY:            'Context Activities property values should prefer to be an array of Activities rather than a single Activity object.',
  CONTEXT_ACTIVITIES_MUST_BE_ARRAY_OR_ACTIVITY_OBJ: 'Context Activities property values must be an array of Activity Objects or a single Activity Object.',
  CONTEXT_ACTIVITIES_MUST_BE_NON_NULL_MAP_OBJECT:   'The Context Activities instances must be a non-null map object.',
  CONTEXT_MUST_BE_NON_NUL_MAP_OBJECT:               'If present, the "context" property must be a non-null map object.',
  REGISTRATION_MUST_BE_UUID_STRING:                 'If present, the registration property must be a UUID string.',
  REVISION_MUST_BE_AGENT_OR_GROUP:                  'The revision property must not be used if the Statement\'s Object is an Agent or Group.',
  LANGUAGE_MUST_BE_STRING:                          'The language property must be encoded as an RFC 5646 compliant string, but was not.',
  OBJECT_MUST_BE_DEFINED:                           '"object" property must be provided.',
  OBJECT_MUST_BE_NON_NULL_MAP_OBJECT:               '"object" property must be a non-null map object.',
  SUB_STATEMENT_MUST_NOT_CONTAIN_SUB_STATEMENT:     'A SubStatement must not contain a SubStatement',
  OBJECT_TYPE_MUST_BE_VALID_OPTION:                 'object\'s "objectType" did not match a valid option',
  IDS_SHOULD_BE_GENERATED_BY_LRS:                   'Ids should be generated by the Activity Provider, and must be generated by the LRS',
  ID_MUST_BE_VALID:                                 'Id was not a valid UUID',
  STATEMENT_ARGUMENT_MUST_BE_PROVIDED:              'No statement argument provided.',
  STATEMENT_MUST_NOT_BE_NULL:                       'Null statement argument provided.',
  STATEMENT_MUST_BE_PARSED_CORRECTLY:               'Null or non-object statement value parsed from provided statment JSON.',
  INVALID_JSON:                                     'Invalid JSON. The statement could not be parsed.',
  STATEMENT_ARGUMENT_IS_NOT_VALID:                  'Statement argument provided was not a valid object or a valid JSON string.'
});

export {xapiErrorLevels};
export {xapiValidationErrors};