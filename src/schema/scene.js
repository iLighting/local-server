//noinspection JSUnresolvedVariable
const co = require('co');
const { Schema } = require('mongoose');
const _ = require('lodash');
const mix = require('../utils/mix');


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
staticSceneSchema.static('joinItems', function (query={}, cb) {
  const StaticScene = this;
  const StaticSceneItem = this.model('StaticSceneItem');
  co(function * () {
    const scenes = yield StaticScene.find(query).exec();
    const result = scenes.map(scene => scene.toObject());
    for(let i=0; i<result.length; i++) {
      let items = yield StaticSceneItem.find({scene: result[i].id}).exec();
      result[i].items = items.map(item => item.toObject());
    }
    return result;
  })
    .then(result => {
      cb(null, result);
    })
    .catch(err => {
      cb(err)
    });
});
/**
 * @function setContent
 * @param {String} sceneId
 * @param {Object} content
 * @param {Boolean} shouldReplaceItems
 * @param {Function} cb
 */
staticSceneSchema.static('setContent', function (sceneId, content, shouldReplaceItems, cb) {
  const StaticScene = this;
  const StaticSceneItem = this.model('StaticSceneItem');
  co(function * () {
    const scene = yield StaticScene.findById(sceneId).exec();
    if (!scene) throw new Error(`${sceneId} 场景id无效`);
    // 设置除items之外的属性 name
    const contentExpItems = _.pick(content, ['name']);
    yield scene.update(contentExpItems).exec();
    if (shouldReplaceItems) {
      // 删除原items
      yield StaticSceneItem.find({scene: sceneId}).remove().exec();
      // 过滤、注入一些item字段
      const safeItems = _.chain(content.items)
        .map(item => {
          const picked = _.pick(item, ['ieee', 'ep', 'scenePayload']);
          picked.scene = sceneId;
          return picked;
        })
        .value();
      yield StaticSceneItem.create(safeItems);
    }
    // 返回修改后的对象
    const [newSceneList] = yield mix.wrap2ReturnPromise(StaticScene.joinItems.bind(StaticScene))({
      _id: sceneId
    });
    return newSceneList[0];
  })
    .then(result => {cb(null, result)})
    .catch(cb);
});


module.exports = {
  [staticSceneItemSchema.name]: staticSceneItemSchema,
  [staticSceneSchema.name]: staticSceneSchema,
};
