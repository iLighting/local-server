let nwk = 0;

const devDesc = [{
    nwk: nwk,
    ieee: '40-73-29-6-0-4B-12-0',
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
    ieee: '40-73-29-6-0-4B-12-1',
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
    ieee: '4F-AC-47-6-0-4B-12-2',
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
    ieee: '73-4F-15-1-0-4B-12-0',
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
    ieee: '7-AC-47-6-0-4B-12-0',
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
    ieee: '4F-AC-47-6-0-4B-12-0',
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
    ieee: '29-1-4C-1-0-4B-12-0',
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
    name: '开灯',
    items: [{
      ieee: '00-00-00-00-00-00-00-00',
      ep: 8,
      scenePayload: {
        on: true
      }
    }, {
      ieee: '00-00-00-00-00-00-00-01',
      ep: 8,
      scenePayload: {
        on: true
      }
    }, {
      ieee: '7-AC-47-6-0-4B-12-0',
      ep: 8,
      scenePayload: {
        on: true
      }
    }]
  },
  {
    name: '关灯',
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
    }, {
      ieee: '7-AC-47-6-0-4B-12-0',
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
  name: '低照度开灯',
  sceneIndex: 0,
  timeRange: ['18:00', '23:59'],
  rules: [{
    ieee: '00-00-00-00-00-00-01-00',
    ep: 8,
    type: 'lt',
    payload: 100
  }]
}, {
  name: '高照度关灯',
  sceneIndex: 1,
  timeRange: ['05:00', '10:00'],
  rules: [{
    ieee: '00-00-00-00-00-00-01-00',
    ep: 8,
    type: 'gt',
    payload: 100
  }]
}]

function* clearAll(models) {
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
}

function* mockDevice(models) {
  const {
    Device,
    App,
  } = models;
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

}

function* mockScene(models) {
  const {
    StaticScene,
    StaticSceneItem,
  } = models;
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
}

function* mockRule(models) {
  const {
    JudgeRuleGroup
  } = models;
  // create judgeRuleGroupSchema
  for (let i = 0; i < judgeRuleGroupDesc.length; i++) {
    const {
      name,
      sceneIndex,
      timeRange,
      rules
    } = judgeRuleGroupDesc[i];
    const sceneList = yield StaticScene.find().exec();
    yield JudgeRuleGroup.create({
      name,
      scene: sceneList[i].id,
      timeRange,
      rules
    })
  }
}

module.exports = function* mock(models) {
  yield clearAll(models)
  yield mockDevice(models)
};