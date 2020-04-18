import { matchesState } from './utils';
import { mapState } from './mapState';
import { StateNode } from './StateNode';
import { State } from './State';
import { Machine, createMachine } from './Machine';
import { Actor } from './Actor';
import {
  raise,
  send,
  sendParent,
  sendUpdate,
  log,
  cancel,
  start,
  stop,
  assign,
  after,
  done,
  respond,
  doneInvoke,
  forwardTo,
  escalate,
  choose,
  pure
} from './actions';
import { interpret, Interpreter, spawn } from './interpreter';
import { matchState } from './match';

const actions = {
  raise,
  send,
  sendParent,
  sendUpdate,
  log,
  cancel,
  start,
  stop,
  assign,
  after,
  done,
  respond,
  forwardTo,
  escalate,
  choose,
  pure
};

export {
  Actor,
  Machine,
  StateNode,
  State,
  matchesState,
  mapState,
  actions,
  assign,
  send,
  sendParent,
  sendUpdate,
  forwardTo,
  interpret,
  Interpreter,
  matchState,
  spawn,
  doneInvoke,
  createMachine
};

export * from './types';
