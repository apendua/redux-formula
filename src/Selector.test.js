/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint func-names: "off" */

import Scope from './Scope';
import Selector, {
  lift,
  constant,
} from './Selector';
import { identity } from './utils';

const constant1 = x => () => x;
// const identity = x => x;

describe('Test Selector', () => {
  describe('Given constant functor', () => {
    beforeEach(function () {
      this.obj = {};
    });
    it('should create constant of order 0', function () {
      constant(0)(this.obj).should.equal(this.obj);
    });
    it('should create constant of order 1', function () {
      constant(1)(this.obj)().should.equal(this.obj);
    });
    it('should create constant of order 2', function () {
      constant(2)(this.obj)()().should.equal(this.obj);
    });
    it('should create constant of order 2', function () {
      constant(3)(this.obj)()()().should.equal(this.obj);
    });
  });

  describe('Given lift functor', () => {
    beforeEach(function () {
      this.obj = {};
      this.s1 = x => x;
      this.s2 = x => y => x + y;
      this.s3 = x => y => z => x + y + z;
    });
    it('should create lift of order 0, 0', function () {
      lift(0, 0)(this.s1)(1).should.equal(1);
    });
    it('should create lift of order 0, 1', function () {
      lift(0, 1)(this.s1)()(1).should.equal(1);
    });
    it('should create lift of order 0, 2', function () {
      lift(0, 2)(this.s1)()()(1).should.equal(1);
    });
    it('should create lift of order 1, 0', function () {
      lift(1, 0)(this.s2)(1)(2).should.equal(3);
    });
    it('should create lift of order 1, 1', function () {
      lift(1, 1)(this.s2)(1)()(2).should.equal(3);
    });
    it('should create lift of order 1, 2', function () {
      lift(1, 2)(this.s2)(1)()()(2).should.equal(3);
    });
    it('should create lift of order 2, 0', function () {
      lift(2, 0)(this.s2)(1)(2).should.equal(3);
    });
    it('should create lift of order 2, 1', function () {
      lift(2, 1)(this.s2)(1)(2)().should.equal(3);
    });
    it('should create lift of order 2, 2', function () {
      lift(2, 2)(this.s2)(1)(2)()().should.equal(3);
    });
  });

  describe('Given a scope without unknowns', () => {
    beforeEach(function () {
      this.scope = new Scope();
    });
    it('should select a literal', function () {
      const selector = Selector.relativeTo(this.scope, constant1(1));
      selector.selector().should.equal(1);
    });
    it('should select a specified literal', function () {
      const selector = Selector.relativeTo(
        this.scope,
        identity,
      );
      selector.selector(1).should.equal(1);
    });
    it('should select a specified literal indirectly', function () {
      const selector = Selector.relativeTo(
        this.scope,
        identity,
      ).indirect();
      selector.selector(2)().should.equal(2);
    });
  });

  describe('Given a scope with unknowns', () => {
    beforeEach(function () {
      this.scope = new Scope(null, ['x']);
    });
    it('should select a function that returns a literal', function () {
      const selector = Selector.create(
        this.scope,
        constant1(1),
        identity,
      );
      selector.selector()().should.equal(1);
    });
    it('should select a function that returns a specified literal', function () {
      const selector = Selector.create(
        this.scope,
        identity,
        identity,
      );
      selector.selector(2)().should.equal(2);
    });
    it('should select a specified literal indirectly', function () {
      const selector = Selector.relativeTo(
        this.scope,
        identity,
      ).indirect();
      selector.selector(2)()().should.equal(2);
    });
    it('should select a function that returns a specified variable', function () {
      const selector = Selector.create(
        this.scope,
        new Selector(
          this.scope,
          constant1(({ x }) => x),
        ),
        identity,
      );
      selector.selector()({ x: 2 }).should.equal(2);
    });
    it('should select an incrementation function', function () {
      const selector = Selector.create(
        this.scope,
        new Selector(
          this.scope,
          y => (({ x }) => x + y),
        ),
        identity,
      );
      selector.selector(2)({ x: 1 }).should.equal(3);
    });
  });

  describe('Given a scope with parent unknowns', () => {
    beforeEach(function () {
      this.parentScope = new Scope(null, ['x']);
      this.scope = new Scope(this.parentScope);
    });
    it('should select a function that returns a literal', function () {
      const selector = Selector.create(
        this.scope,
        constant1(1),
        identity,
      );
      selector.selector()().should.equal(1);
    });
    it('should select a function that returns a specified literal', function () {
      const selector = Selector.create(
        this.scope,
        identity,
        identity,
      );
      selector.selector(2)().should.equal(2);
    });
    it('should select a specified literal indirectly', function () {
      const selector = Selector.relativeTo(
        this.scope,
        identity,
      ).indirect();
      selector.selector(2)()().should.equal(2);
    });
    it('should select a function that returns a specified variable', function () {
      const selector = Selector.create(
        this.scope,
        new Selector(
          this.scope,
          constant1(({ x }) => x),
        ),
        identity,
      );
      selector.selector()({ x: 2 }).should.equal(2);
    });
    it('should select an incrementation function', function () {
      const selector = Selector.create(
        this.scope,
        new Selector(
          this.scope,
          y => (({ x }) => x + y),
        ),
        identity,
      );
      selector.selector(2)({ x: 1 }).should.equal(3);
    });
  });

  describe('Given a scope with both self and parent unknowns', () => {
    beforeEach(function () {
      this.parentScope = new Scope(null, ['x']);
      this.scope = new Scope(this.parentScope, ['y']);
    });
    it('should select a function that returns a literal', function () {
      const selector = Selector.create(
        this.scope,
        constant1(1),
        identity,
      );
      selector.selector()()().should.equal(1);
    });
    it('should select a function that returns a specified literal', function () {
      const selector = Selector.create(
        this.scope,
        identity,
        identity,
      );
      selector.selector(2)()().should.equal(2);
    });
    it('should select a specified literal indirectly', function () {
      const selector = Selector.relativeTo(
        this.scope,
        identity,
      ).indirect();
      selector.selector(2)()()().should.equal(2);
    });
    it('should select a function that returns a specified variable', function () {
      const selector = Selector.create(
        this.scope,
        new Selector(
          this.scope,
          constant1(constant1(({ x }) => x)),
        ),
        identity,
      );
      selector.selector()()({ x: 2 }).should.equal(2);
    });
    it('should select an incrementation function', function () {
      const selector = Selector.create(
        this.scope,
        new Selector(
          this.parentScope,
          x => y => x + y,
        ),
        new Selector(
          this.scope,
          x => y => z => x + y + z,
        ),
        (a, b) => a + b,
      );
      selector.selector(1)(2)(3).should.equal(9);
    });
  });
});
