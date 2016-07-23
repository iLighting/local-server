用HTTP API模拟zigbee事件
============

细节参看 zigbee-LAN-interface.md

触发事件
-------------

POST `/zigbee-lan/api/join`
POST `/zigbee-lan/api/leave`
POST `/zigbee-lan/api/info`

`Content-Type: 'application/json'`

接收消息
-------------

SSE `/zigbee-lan/sse`
