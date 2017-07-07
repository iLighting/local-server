# local server

## 新增应用类型指南

1. `src/schema/zigbee.js`. 数据库schema定义、payload格式检查.
1. `src/utils/appMsg.js`. 新增build、parse.
1. `bin/config.js`. 新增应用类型号
1. `src/libs/zigbee.js`. 在`ZDO_SIMPLE_DESC_RSP`处理器中，新增类型判断逻辑


## 树莓派安装

## eth0

Append `/etc/dhcpcd.conf`

```
interface eth0
static routers=192.168.9.1
inform 192.168.9.2
```

## 切换视频输出

```bash
vim /usr/share/X11/xorg.conf.d/99-fbturbo.conf
```

### chromium自启动

```bash
echo "@chromium-browser --app=http://localhost:3001 --start-maximized" > ~/.config/lxsession/LXDE-pi/autostart
```

### 关闭屏保

```bash
echo "@xset -dpms" > ~/.config/lxsession/LXDE-pi/autostart
echo "@xset s off" > ~/.config/lxsession/LXDE-pi/autostart
```