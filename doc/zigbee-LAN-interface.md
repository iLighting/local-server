ZigBee LAN event
=============

device
---------

### join

```javascript
{
  id: 123,
  type: 'router',
  apps: [
    {endPoint: 8, type: 'lamp'},
  ]
}
```

### leave

```javascript
{
  id: 123
}
```

### info

```javascript
{
  id: 123,
  ieee: '....',
  apps: [
    {endPoint: 8, type: '...', payload: {} }
  ]
}
```

For example

**lamp**

```javascript
{
  endPoint: 8,
  type: 'lamp',
  level: 90 // 0~100
}
```

**switch**

```javascript
{
  endPoint: 8,
  type: 'switch',
  level: 90 // 0~100
}
```

**sensor**

```javascript
{
  endPoint: 8,
  type: 'light-sensor',
  level: 123 // lux
}
```

ZigBee LAN API
================

`sendOne(id, appObj)`
----------

向指定app发送数据

`leave(id)`
----------

移除指定设备
