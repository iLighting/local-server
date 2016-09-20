//noinspection JSUnresolvedVariable
const { expect } = require('chai');
const { Schema } = require('mongoose');


const staticSceneItemSchema = new Schema({
  scene: Schema.Types.ObjectId,
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
staticSceneItemSchema.name = 'StaticSceneItem';


const staticSceneSchema = new Schema({
  name: { $type: String, required: true }
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
staticSceneSchema.name = 'StaticScene';


module.exports = {
  [staticSceneItemSchema.name]: staticSceneItemSchema,
  [staticSceneSchema.name]: staticSceneSchema,
};
