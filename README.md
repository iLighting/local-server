# local server

## 新增应用类型指南

1. `src/schema/zigbee.js`. 数据库schema定义、payload格式检查.
1. `src/utils/appMsg.js`. 新增build、parse.
1. `bin/config.js`. 新增应用类型号
1. `src/libs/zigbee.js`. 在`ZDO_SIMPLE_DESC_RSP`处理器中，新增类型判断逻辑
