const co = require('co');
const expect = require('chai').expect;
const {
  Schema
} = require('mongoose');
const _ = require('lodash');
const mix = require('../utils/mix');

const judgeRuleGroupSchema = new Schema({
  name: String,
  scene: Schema.Types.ObjectId,
  timeRange: [],
  rules: [],
}, {
  timestamps: true,
  toObject: {
    getters: true,
    virtuals: true,
    minimize: false,
    retainKeyOrder: true,
  },
  toJSON: this.toObject,
  strict: true,
  typeKey: '$type',
  minimize: false,
});
judgeRuleGroupSchema.name = 'JudgeRuleGroup';
judgeRuleGroupSchema.ruleTypes = [ // 全部是闭合区间
  'equal', 'nequal',
  'range', 'nrange',
  'gt', 'lt',
  'ignore'
];
judgeRuleGroupSchema.pre('validate', function (next) {
  const {
    scene,
    timeRange,
    rules
  } = this;
  const ruleTypes = judgeRuleGroupSchema.ruleTypes;
  try {
    expect(timeRange).to.be.an('array');
    expect(timeRange).to.have.lengthOf(2);
    expect(rules).to.be.a('array');
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      // property: ieee
      expect(rule).to.have.property('ieee').that.is.a('string');
      // property: ep
      expect(rule).to.have.property('ep').that.is.a('number');
      // property: type
      expect(rule).to.have.property('type').that.is.a('string');
      expect(rule.type).to.be.oneOf(ruleTypes);
      // property: payload
      expect(rule).to.have.property('payload');
      switch (rule.type) {
        case 'range':
        case 'nrange':
          expect(rule.payload).to.be.a('array').that.have.lengthOf(2);
          break;
        case 'gt':
        case 'lt':
          expect(rule.payload).to.be.a('number');
          break;
      }
    }
    next();
  } catch (e) {
    next(e)
  }
});

module.exports = {
  [judgeRuleGroupSchema.name]: judgeRuleGroupSchema,
};