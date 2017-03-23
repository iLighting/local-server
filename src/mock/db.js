let nwk = 0;

const devDesc = [{
    nwk: nwk,
    ieee: '00-00-00-00-00-00-00-00',
    type: 'router',
    name: `router@${nwk++}`,
    apps: [{
      endPoint: 8,
      type: 'lamp',
      name: '灯具1',
      payload: {
        on: true
      }
    }]
  },
  {
    nwk: nwk,
    ieee: '00-00-00-00-00-00-00-01',
    type: 'router',
    name: `router@${nwk++}`,
    apps: [{
      endPoint: 8,
      type: 'lamp',
      name: '灯具2',
      payload: {
        on: true
      }
    }]
  },
  {
    nwk: nwk,
    ieee: '00-00-00-00-00-00-00-02',
    type: 'router',
    name: `router@${nwk++}`,
    apps: [{
      endPoint: 8,
      type: 'gray-lamp',
      name: '灯具3',
      payload: {
        level: 50
      }
    }]
  },
  {
    nwk: nwk,
    ieee: '00-00-00-00-00-00-01-00',
    type: 'router',
    name: `router@${nwk++}`,
    apps: [{
      endPoint: 8,
      type: 'illuminance-sensor',
      name: '照度传感器1',
      payload: {
        level: 0
      }
    }]
  },
  {
    nwk: nwk,
    ieee: '00-00-00-00-00-00-01-01',
    type: 'router',
    name: `router@${nwk++}`,
    apps: [{
      endPoint: 8,
      type: 'temperature-sensor',
      name: '温度传感器1',
      payload: {
        temperature: 0
      }
    }]
  },
  {
    nwk: nwk,
    ieee: '00-00-00-00-00-00-01-02',
    type: 'router',
    name: `router@${nwk++}`,
    apps: [{
      endPoint: 8,
      type: 'occupy-sensor',
      name: '占用传感器1',
      payload: {
        occupy: true
      }
    }]
  },
  {
    nwk: nwk,
    ieee: '00-00-00-00-00-00-01-03',
    type: 'router',
    name: `router@${nwk++}`,
    apps: [{
      endPoint: 8,
      type: 'asr-sensor',
      name: '语音识别传感器1',
      payload: {
        index: 0
      }
    }]
  },
];

const sceneDesc = [{
    name: '场景1',
    items: [{
      ieee: '00-00-00-00-00-00-00-00',
      ep: 8,
      scenePayload: {
        on: false
      }
    }, {
      ieee: '00-00-00-00-00-00-00-01',
      ep: 8,
      scenePayload: {
        on: false
      }
    }]
  },
  {
    name: '场景2',
    items: [{
      ieee: '00-00-00-00-00-00-00-00',
      ep: 8,
      scenePayload: {
        on: true
      }
    }]
  }
];

const judgeRuleGroupDesc = [{
  name: '选择器1',
  sceneIndex: 0,
  rules: [{
    ieee: '00-00-00-00-00-00-01-00',
    ep: 8,
    type: 'lt',
    payload: 150
  }]
}]

module.exports = function* mock(models) {
  // 清空数据库
  const {
    Device,
    App,
    StaticScene,
    StaticSceneItem,
    JudgeRuleGroup
  } = models;
  yield Device.remove().exec();
  yield App.remove().exec();
  yield StaticScene.remove().exec();
  yield StaticSceneItem.remove().exec();
  yield JudgeRuleGroup.remove().exec();

  // create devices
  for (let i = 0; i < devDesc.length; i++) {
    const {
      nwk,
      ieee,
      type,
      name,
      apps
    } = devDesc[i];
    yield Device.create({
      nwk,
      ieee,
      type,
      name
    });
    // create apps
    for (let j = 0; j < apps.length; j++) {
      yield App.create({
        device: nwk,
        endPoint: apps[j].endPoint,
        type: apps[j].type,
        name: apps[j].name,
        payload: apps[j].payload
      })
    }
  }

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

  // create judgeRuleGroupSchema
  for (let i = 0; i < judgeRuleGroupDesc.length; i++) {
    const {
      name,
      sceneIndex,
      rules
    } = judgeRuleGroupDesc[i];
    const sceneList = yield StaticScene.find().exec();
    yield JudgeRuleGroup.create({
      name,
      scene: sceneList[i].id,
      rules
    })
  }
};