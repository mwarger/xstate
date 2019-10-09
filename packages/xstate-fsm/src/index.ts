import { StateMachine, EventObject, Typestate } from './types';

function toArray<T>(item: T | T[] | undefined): T[] {
  return item === undefined ? [] : ([] as T[]).concat(item);
}

const assignActionType: StateMachine.AssignAction = 'xstate.assign';

export function assign(assignment: any): StateMachine.ActionObject<any, any> {
  return {
    type: assignActionType,
    assignment
  };
}

function toActionObject<TContext, TEvent extends EventObject>(
  // tslint:disable-next-line:ban-types
  action:
    | string
    | StateMachine.ActionFunction<TContext, TEvent>
    | StateMachine.ActionObject<TContext, TEvent>
) {
  return typeof action === 'string'
    ? { type: action }
    : typeof action === 'function'
    ? {
        type: action.name,
        exec: action
      }
    : action;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function createMatcher(value) {
  return stateValue => value === stateValue;
}

function toEventObject<TEvent extends EventObject>(
  event: TEvent['type'] | TEvent
): TEvent {
  return (typeof event === 'string' ? { type: event } : event) as TEvent;
}

export function createMachine<
  TContext extends object,
  TEvent extends EventObject = EventObject,
  TState extends Typestate<TContext> = any
>(
  fsmConfig: StateMachine.Config<TContext, TEvent>
): StateMachine.Machine<TContext, TEvent, TState> {
  return {
    initialState: {
      value: fsmConfig.initial,
      actions: toArray(fsmConfig.states[fsmConfig.initial].entry).map(
        toActionObject
      ),
      context: fsmConfig.context!,
      matches: createMatcher(fsmConfig.initial)
    },
    transition: (
      state: string | StateMachine.State<TContext, TEvent, TState>,
      event: string | Record<string, any> & { type: string }
    ): StateMachine.State<TContext, TEvent, TState> => {
      const { value, context } =
        typeof state === 'string'
          ? { value: state, context: fsmConfig.context! }
          : state;
      const eventObject = toEventObject(event);
      const stateConfig = fsmConfig.states[value];

      if (!IS_PRODUCTION) {
        if (!stateConfig) {
          throw new Error(
            `State '${value}' not found on machine${
              fsmConfig.id ? ` '${fsmConfig.id}'` : ''
            }.`
          );
        }
      }

      if (stateConfig.on) {
        const transitions = toArray(stateConfig.on[eventObject.type]);

        for (const transition of transitions) {
          if (transition === undefined) {
            return {
              value,
              context,
              actions: [],
              changed: false,
              matches: createMatcher(value)
            };
          }

          const { target, actions = [], cond = () => true } =
            typeof transition === 'string'
              ? { target: transition }
              : transition;

          let nextContext = context;

          if (cond(context, eventObject)) {
            const nextStateConfig = target
              ? fsmConfig.states[target]
              : stateConfig;
            let assigned = false;
            const allActions = ([] as any[])
              .concat(stateConfig.exit, actions, nextStateConfig.entry)
              .filter(a => a)
              .map<StateMachine.ActionObject<TContext, TEvent>>(toActionObject)
              .filter(action => {
                if (action.type === assignActionType) {
                  assigned = true;
                  let tmpContext = Object.assign({}, nextContext);

                  if (typeof action.assignment === 'function') {
                    tmpContext = action.assignment(nextContext, eventObject);
                  } else {
                    Object.keys(action.assignment).forEach(key => {
                      tmpContext[key] =
                        typeof action.assignment[key] === 'function'
                          ? action.assignment[key](nextContext, eventObject)
                          : action.assignment[key];
                    });
                  }

                  nextContext = tmpContext;
                  return false;
                }
                return true;
              });
            const nextValue = target ? target : value;
            return {
              value: nextValue,
              context: nextContext,
              actions: allActions,
              changed: nextValue !== value || allActions.length > 0 || assigned,
              matches: createMatcher(nextValue)
            };
          }
        }
      }

      // No transitions match
      return {
        value,
        context,
        actions: [],
        changed: false,
        matches: createMatcher(value)
      };
    }
  };
}

export function interpret<
  TContext,
  TEvent extends EventObject = any,
  TState extends Typestate<TContext> = any
>(
  machine: StateMachine.Machine<TContext, TEvent, TState>
): StateMachine.Service<TContext, TEvent, TState> {
  let state = machine.initialState;
  let started = false;
  const listeners = new Set<StateMachine.StateListener<typeof state>>();

  const service = {
    send: (event: TEvent | TEvent['type']): void => {
      if (!started) {
        return;
      }
      state = machine.transition(state, event);
      state.actions.forEach(
        ({ exec }) => exec && exec(state.context, toEventObject(event))
      );
      listeners.forEach(listener => listener(state));
    },
    subscribe: (listener: StateMachine.StateListener<typeof state>) => {
      listeners.add(listener);
      listener(state);

      return {
        unsubscribe: () => listeners.delete(listener)
      };
    },
    start: () => ((started = true), service),
    stop: () => (
      (started = false),
      listeners.forEach(listener => listeners.delete(listener)),
      service
    )
  };

  return service;
}
