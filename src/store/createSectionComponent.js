import React from 'react';
import PropTypes from 'prop-types';
import {
  defaultMemoize,
  createStructuredSelector,
} from 'reselect';
import forEach from 'lodash/forEach';
import {
  argument,
} from '../utils/functions';
import {
  defaultCompiler,
} from '../formulaSelector';

/*
const Scope = createSectionComponent(context);

<Scope form='state:form' dialog='state:dialog'>
  ...
</Scope>
*/

const isStateMethod = name => (
  name === 'set' ||
  name === 'del' ||
  name === 'push' ||
  name === 'pull'
);

const createSubState = (variableScope, stateVariable, name) => {
  const newStateVariable = variableScope.createVariable({
    createSelector: referencingScope => referencingScope.boundSelector(
      stateVariable.selector,
      value => value && value[name],
    ),
    createGetProperty: (definitionScope) => {
      const { getProperty } = stateVariable;
      return (propName) => {
        if (isStateMethod(propName)) {
          const prop = getProperty(propName);
          return definitionScope.createVariable({
            createSelector: referencingScope => referencingScope.boundSelector(
              prop.selector,
              v => (key, ...args) => v(`${name}.${key}`, ...args),
            ),
          });
        }
        return createSubState(definitionScope, newStateVariable, propName);
      };
    },
  });
  return newStateVariable;
};

const createSectionComponent = (context) => {
  class Scope extends React.PureComponent {
    constructor(props) {
      super(props);
      this.getValue = createStructuredSelector({
        store: value => value.store,
        scope: defaultMemoize(
          (value, variables) => {
            let scope;
            if (value.scope) {
              scope = value.scope.create();
            } else {
              const rootScope = defaultCompiler.createScope();
              const rootState = rootScope.define('state', {
                createSelector: definitionScope => definitionScope.relative(argument(0)),
                createGetProperty: definitionScope => (propName) => {
                  if (isStateMethod(propName)) {
                    return definitionScope.createVariable({
                      createSelector: refrencingScope =>
                        refrencingScope.relative(argument(2, propName)),
                    });
                  }
                  return createSubState(definitionScope, rootState, propName);
                },
              });
              rootScope.define('props', {
                createSelector: refrencingScope => refrencingScope.relative(argument(1)),
              });
              scope = rootScope.create();
            }
            forEach(variables, (expression, name) => {
              scope.define(name, defaultCompiler.compile(expression));
            });
            return scope;
          },
        ),
      });
    }

    render() {
      const {
        children,
        ...variables
      } = this.props;
      return (
        <context.Consumer>
          {value => (
            <context.Provider value={this.getValue(value, variables)}>
              {children}
            </context.Provider>
          )}
        </context.Consumer>
      );
    }
  }

  Scope.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return Scope;
};

export default createSectionComponent;