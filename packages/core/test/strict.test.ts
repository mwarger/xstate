import { Machine } from '../src/index';
// @ts-ignore
import { StateValue } from '../src/types';

describe('strict mode', () => {
  const pedestrianStates = {
    initial: 'walk',
    states: {
      walk: {
        on: {
          PED_COUNTDOWN: 'wait'
        },
        onEntry: 'enter_walk',
        onExit: 'exit_walk'
      },
      wait: {
        on: {
          PED_COUNTDOWN: 'stop'
        },
        onEntry: 'enter_wait',
        onExit: 'exit_wait'
      },
      stop: {
        type: 'final' as const,
        onEntry: 'enter_stop',
        onExit: 'exit_stop'
      }
    }
  };

  const lightMachine = Machine({
    strict: true,
    key: 'light',
    initial: 'green',
    states: {
      green: {
        on: {
          TIMER: 'yellow',
          POWER_OUTAGE: 'red',
          NOTHING: 'green'
        },
        onEntry: 'enter_green',
        onExit: 'exit_green'
      },
      yellow: {
        on: {
          TIMER: 'red',
          POWER_OUTAGE: 'red'
        },
        onEntry: 'enter_yellow',
        onExit: 'exit_yellow'
      },
      red: {
        on: {
          TIMER: 'green',
          POWER_OUTAGE: 'red',
          NOTHING: 'red'
        },
        onEntry: 'enter_red',
        onExit: 'exit_red',
        ...pedestrianStates
      }
    }
  });

  // @ts-ignore
  const parallelMachine = Machine({
    type: 'parallel',
    states: {
      a: {
        initial: 'a1',
        states: {
          a1: {
            on: { CHANGE: 'a2' },
            onEntry: 'enter_a1',
            onExit: 'exit_a1'
          },
          a2: { onEntry: 'enter_a2', onExit: 'exit_a2' }
        },
        onEntry: 'enter_a',
        onExit: 'exit_a'
      },
      b: {
        initial: 'b1',
        states: {
          b1: {
            on: { CHANGE: 'b2' },
            onEntry: 'enter_b1',
            onExit: 'exit_b1'
          },
          b2: { onEntry: 'enter_b2', onExit: 'exit_b2' }
        },
        onEntry: 'enter_b',
        onExit: 'exit_b'
      }
    },
    strict: true
  });

  it('should throw for unacceptable events', () => {
    expect(() => {
      lightMachine.transition('green', 'FOO');
    }).toThrow();
  });

  it('should not throw for built-in events', () => {
    expect(() => {
      lightMachine.transition('red.wait', 'PED_COUNTDOWN');
    }).not.toThrow();
  });
});
