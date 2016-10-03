/**
 * test.root.js
 *
 * root test for mocha
 *
 * @author Chen Liang [chen.liang@nuorder.com]
 */

/* global chai, var2 */
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const chaiThings = require('chai-things');
const sinonChai = require('sinon-chai');
const chai = require('chai');
const sinon = require('sinon');

chai.should();
global.expect = chai.expect;
global.sinon = sinon;
chai.use(chaiThings);
chai.use(sinonChai);
