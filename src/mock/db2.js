
const devDesc = [
  {
    nwk: 0,
    ieee: '00-00-00-00-00-00-00-00',
    type: 'router',
    name: `router@0`,
    apps: [{
      endPoint: 8,
      type: 'lamp',
      name: '灯具1',
      payload: {on: true}
    }]
  },
  {
    nwk: 1,
    ieee: '00-00-00-00-00-00-00-01',
    type: 'router',
    name: `router@1`,
    apps: [{
      endPoint: 8,
      type: 'pulse',
      name: '轻触开关1',
      payload: {transId: 1}
    }]
  }
];

const sceneDesc = [
  {
    name: '场景1',
    items: [{
      ieee: '00-00-00-00-00-00-00-00',
      ep: 8,
      scenePayload: {on: false}
    }]
  },
  {
    name: '场景2',
    items: [{
      ieee: '00-00-00-00-00-00-00-00',
      ep: 8,
      scenePayload: {on: true}
    }]
  }
];

module.exports = function * mock(models) {
  // 清空数据库
  const { Device, App, StaticScene, StaticSceneItem } = models;
  yield Device.remove().exec();
  yield App.remove().exec();
  yield StaticScene.remove().exec();
  yield StaticSceneItem.remove().exec();

  // create devices
  for(let i=0; i<devDesc.length; i++) {
    const { nwk, ieee, type, name, apps } = devDesc[i];
    yield Device.create({nwk, ieee, type, name});
    // create apps
    for(let j=0; j<apps.length; j++) {
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
  for(let i=0; i<sceneDesc.length; i++) {
    const { name, items } = sceneDesc[i];
    const scene = yield StaticScene.create({name});
    for(let j=0; j<items.length; j++) {
      yield StaticSceneItem.create({
        scene: scene.id,
        ieee: items[j].ieee,
        ep: items[j].ep,
        scenePayload: items[j].scenePayload
      })
    }
  }
};