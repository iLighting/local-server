//noinspection JSUnresolvedVariable
const { expect } = require('chai');
const { Schema } = require('mongoose');


const StaticSceneItemSchema = new Schema({
  // 以mac地址为准
  ieee: {$type: String, required: true},
  ep: {$type: Number, min: 0, max: 255},
  scenePayload: {$type: Schema.Types.Mixed, default: {}}
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
StaticSceneItemSchema.name = 'StaticSceneItem';


const StaticSceneSchema = new Schema({
  name: { $type: String, required: true },
  items: [Schema.Types.ObjectId]
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
StaticSceneSchema.name = 'StaticScene';


module.exports = {
  [StaticSceneItemSchema.name]: StaticSceneItemSchema,
  [StaticSceneSchema.name]: StaticSceneSchema,
};
