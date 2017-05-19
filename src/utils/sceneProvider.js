/**
 * 初始化的场景
 */

const co = require('co');

class Provider extends Object {
  /**
   * Creates an instance of Provider.
   * @param {Object} models 
   * @param {Object} [db] 
   * 
   * @memberOf Provider
   */
  constructor(models, db) {
    super();
    this._models = models;
    this._db = db;
  }
  /**
   * 默认场景
   * 
   * @returns {Promise}
   * 
   * @memberOf Provider
   */
  default () {
    const ieee = {
      lamp: '40-73-29-6-0-4B-12-0',
      grayLamp: '4F-AC-47-6-0-4B-12-2',
      occupy: '4F-AC-47-6-0-4B-12-0',
      temperature: '7-AC-47-6-0-4B-12-0',
      illuminance: '73-4F-15-1-0-4B-12-0',
      asr: '29-1-4C-1-0-4B-12-0',
    };
    const {
      StaticScene,
      StaticSceneItem,
      JudgeRuleGroup,
      judgeRuleGroupDesc
    } = this._models;
    return co.wrap(function* () {
      const sceneDesc = [{
        name: '开灯',
        items: [{
          ieee: ieee.lamp,
          ep: 8,
          scenePayload: {
            on: true
          }
        }, {
          ieee: ieee.grayLamp,
          ep: 8,
          scenePayload: {
            level: 40
          }
        }]
      }, {
        name: '阅读',
        items: [{
          ieee: ieee.lamp,
          ep: 8,
          scenePayload: {
            on: true
          }
        }, {
          ieee: ieee.grayLamp,
          ep: 8,
          scenePayload: {
            level: 90
          }
        }]
      }, {
        name: '影院',
        items: [{
          ieee: ieee.lamp,
          ep: 8,
          scenePayload: {
            on: true
          }
        }, {
          ieee: ieee.grayLamp,
          ep: 8,
          scenePayload: {
            level: 0
          }
        }]
      }, {
        name: '温馨',
        items: [{
          ieee: ieee.lamp,
          ep: 8,
          scenePayload: {
            on: true
          }
        }, {
          ieee: ieee.grayLamp,
          ep: 8,
          scenePayload: {
            level: 10
          }
        }]
      }, {
        name: '全亮',
        items: [{
          ieee: ieee.lamp,
          ep: 8,
          scenePayload: {
            on: true
          }
        }, {
          ieee: ieee.grayLamp,
          ep: 8,
          scenePayload: {
            level: 100
          }
        }]
      }, {
        name: '关灯',
        items: [{
          ieee: ieee.lamp,
          ep: 8,
          scenePayload: {
            on: false
          }
        }, {
          ieee: ieee.grayLamp,
          ep: 8,
          scenePayload: {
            level: 0
          }
        }]
      }, {
        name: '夜灯',
        items: [{
          ieee: ieee.lamp,
          ep: 8,
          scenePayload: {
            on: false
          }
        }, {
          ieee: ieee.grayLamp,
          ep: 8,
          scenePayload: {
            level: 25
          }
        }]
      }];
      const judgeRuleGroupDesc = [{
        name: '切换开灯',
        sceneIndex: '开灯',
        timeRange: ['18:00', '23:59'],
        rules: [{
          // occupy
          ieee: ieee.occupy,
          ep: 8,
          type: 'gt',
          payload: 0.5
        }, {
          // illuminance
          ieee: ieee.illuminance,
          ep: 8,
          type: 'lt',
          payload: 50
        }]
      }, {
        name: '切换阅读',
        sceneIndex: '阅读',
        timeRange: ['00:00', '23:59'],
        rules: []
      }, {
        name: '切换影院',
        sceneIndex: '影院',
        timeRange: ['00:00', '23:59'],
        rules: []
      }, {
        name: '切换温馨',
        sceneIndex: '温馨',
        timeRange: ['00:00', '23:59'],
        rules: []
      }, {
        name: '切换全亮',
        sceneIndex: '全亮',
        timeRange: ['00:00', '23:59'],
        rules: []
      }, {
        name: '切换关灯',
        sceneIndex: '关灯',
        timeRange: ['06:00', '10:00'],
        rules: [{
          // illuminance
          ieee: ieee.illuminance,
          ep: 8,
          type: 'gt',
          payload: 50
        }]
      }, {
        name: '切换夜灯',
        sceneIndex: '夜灯',
        timeRange: ['00:00', '23:59'],
        rules: []
      }]
      // create scene
      for (let i = 0; i < sceneDesc.length; i++) {
        const {
          name,
          items
        } = sceneDesc[i];
        const scene = yield StaticScene.create({
          name
        });
        for (let j = 0; j < items.length; j++) {
          yield StaticSceneItem.create({
            scene: scene.id,
            ieee: items[j].ieee,
            ep: items[j].ep,
            scenePayload: items[j].scenePayload
          })
        }
      }
      // create chooser
      for (let i = 0; i < judgeRuleGroupDesc.length; i++) {
        const {
          name,
          sceneIndex,
          timeRange,
          rules
        } = judgeRuleGroupDesc[i];
        const scene = yield StaticScene.findOne({
          name: sceneIndex
        }).exec();
        yield JudgeRuleGroup.create({
          name,
          scene,
          timeRange,
          rules
        })
      }
    })()
  }
}

module.exports = Provider;