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
  message: 'ok',
  payload: [
    {
      id: 123,
      type: 'router',
      apps: [{endPoint: 8, type: 'lamp'}, /* and so on */]
    },
    /* and so on */
  ]
}
```
### `/api/device/:id`

**GET**

```javascript
{
  message: 'ok',
  payload: {
    id: 123,
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

### `/api/device/:id/:ep`

**GET**

```javascript
{
  message: 'ok',
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
  message: 'ok',
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
