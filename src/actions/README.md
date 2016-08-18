# action设计规范

## action开始

- 所有负载挂在`payload`字段

## action结束（成功）

- 所有负载挂在`payload`字段

## action结束（失败）

- 与异常相关的结构，挂在`payload`字段
- 异常对象，挂在`err`字段。此异常对象的`toString()`输出必须是可读的。
