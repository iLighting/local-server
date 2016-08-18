Web client API
=================

接收消息
----------

### `/sse`

API
----------

### `/api/device`

query:
- `type`: 设备类型

**GET**

```javascript
{
  type: 'ok',
  payload: [
    {
      nwk: 123,
      ieee: 'dddd',
      type: 'router',
      apps: [{endPoint: 8, type: 'lamp'}, /* and so on */]
    },
    /* and so on */
  ]
}
```
### `/api/device/:nwk`

**GET**

```javascript
{
  type: 'ok',
  payload: {
    nwk: 123,
    ieee: 'xxx',
    type: 'router',
    apps: [
      {
        endPoint: 8,
        type: 'lamp',
        payload: {/*...*/}
      },
      /* and so on */
    ]
  }
}
```

### `/api/device/:nwk/:ep`

**GET**

```javascript
{
  type: 'ok',
  payload: {
    endPoint: 8,
    type: 'lamp',
    payload: {/*...*/}
  }
}
```

**PUT**

```javascript
{
  payload: {/*...*/}
}
```

### `/api/app`

**GET**

query:
- `device`: 设备id
- `endPoint`: 端口号
- `type`: app类型

```javascript
{
  type: 'ok',
  payload: [
    {
      device: 123,
      endPoint: 8,
      type: 'lamp'
    },
    /* and so on */
  ]
}
```
