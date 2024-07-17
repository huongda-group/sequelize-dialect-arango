// import * as DataTypes from './_internal/data-types-overrides.js';
// import type { ArangoModule, ArangoConnectionOptions } from './connection-manager.js';
// import { ArangoConnectionManager } from './connection-manager';
// import { ArangoQueryGenerator } from './query-generator.js';
// import { ArangoQueryInterface } from './query-interface.js';
// import { ArangoQuery } from './query.js';

import { getSynchronizedTypeKeys } from '../sequelize/packages/utils/src/common';
import { ArangoConnectionOptions } from './connection-manager';
import { AbstractDialect, Sequelize } from '../sequelize/packages/core/src';
import { DataTypes } from '../sequelize/packages/core/src/index.mjs';
import { createNamedParamBindCollector } from '../sequelize/packages/core/src/utils/sql';

export interface ArangoDialectOptions {
  foreignKeys?: boolean;

  // ArangoModule?: ArangoModule;
}

const DIALECT_OPTION_NAMES = getSynchronizedTypeKeys<ArangoDialectOptions>({
  foreignKeys: undefined,
  // ArangoModule: undefined,
});

const CONNECTION_OPTION_NAMES = getSynchronizedTypeKeys<ArangoConnectionOptions>({
  storage: undefined,
  password: undefined,
  mode: undefined,
});

export class ArangoDialect extends AbstractDialect<ArangoDialectOptions, ArangoConnectionOptions> {
  static supports = AbstractDialect.extendSupport({
    DEFAULT: false,
    'DEFAULT VALUES': true,
    'UNION ALL': false,
    'RIGHT JOIN': false,
    inserts: {
      ignoreDuplicates: ' OR IGNORE',
      updateOnDuplicate: ' ON CONFLICT DO UPDATE SET',
      conflictFields: true,
      onConflictWhere: true,
    },
    index: {
      using: false,
      where: true,
      functionBased: true,
    },
    startTransaction: {
      useBegin: true,
      transactionType: true,
    },
    constraints: {
      foreignKeyChecksDisableable: true,
      add: false,
      remove: false,
    },
    groupedLimit: false,
    dataTypes: {
      CHAR: false,
      COLLATE_BINARY: true,
      CITEXT: true,
      DECIMAL: false,
      // Arango doesn't give us a way to do sql type-based parsing, *and* returns bigints as js numbers.
      // issue: https://github.com/TryGhost/node-Arango/issues/922
      BIGINT: false,
      JSON: true,
    },
    // TODO: add support for JSON operations https://www.Arango.org/json1.html (bundled in Arango)
    //  be careful: json_extract, ->, and ->> don't have the exact same meanings as mysql & mariadb
    jsonOperations: false,
    jsonExtraction: {
      unquoted: false,
      quoted: false,
    },
    truncate: {
      restartIdentity: false,
    },
    delete: {
      limit: false,
    },
  });

  // readonly Query = ArangoQuery;
  // readonly connectionManager: ArangoConnectionManager;
  // readonly queryGenerator: ArangoQueryGenerator;
  // readonly queryInterface: ArangoQueryInterface;

  constructor(sequelize: Sequelize, options: ArangoDialectOptions) {
    super({
      identifierDelimiter: '`',
      options,
      dataTypeOverrides: DataTypes,
      sequelize,
      minimumDatabaseVersion: '3.8.0',
      dataTypesDocumentationUrl: 'https://www.Arango.org/datatype3.html',
      name: 'Arango',
    });

    // this.connectionManager = new ArangoConnectionManager(this);
    // this.queryGenerator = new ArangoQueryGenerator(this);
    // this.queryInterface = new ArangoQueryInterface(this);
  }

  parseConnectionUrl(): ArangoConnectionOptions {
    throw new Error(
      'The "url" option is not supported in Arango. Please use the "storage" option instead.',
    );
  }

  createBindCollector() {
    return createNamedParamBindCollector('$');
  }

  getDefaultSchema(): string {
    // Our Arango implementation doesn't support schemas
    return '';
  }

  static getSupportedOptions() {
    return DIALECT_OPTION_NAMES;
  }

  static getSupportedConnectionOptions(): readonly string[] {
    return CONNECTION_OPTION_NAMES;
  }
}
