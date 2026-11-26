# 更新日志

## v1.3.0 (2026-11-26)

### 平台迁移
- ✨ 支持 OpenWrt 25.12，移除对 `luci-compat` 与 Lua 运行时的依赖
- ✨ LuCI 界面改为 JavaScript view（`/www/luci-static/resources/view/timecontrol/main.js`）
- ✨ 新增 rpcd ubus 后端 `luci.timecontrol`，提供设备发现与规则重载接口
- 🐛 修复设备下拉列表为空：`rpc.declare` 的 `expect` 返回值处理错误
- 🐛 修复规则启用/禁用时报 `ubus code 6`：补齐 `uci` ubus 方法 ACL
- 🐛 修复提交规则后刷新页面导致配置被回滚：改用 `uci commit` 替代带回滚的 `uci.apply()`
- 🐛 修复重启后 nft 规则丢失：`USE_PROCD=0` 时补齐 `start`/`stop`/`reload` 入口
- 🐛 规则改为 fw4 自动 include 文件（`/usr/share/nftables.d/chain-post/raw_prerouting/90-timecontrol.nft`），重启或防火墙重载后自动恢复
- ✨ 设备列表为空时可手动输入设备名称与 MAC 地址
- ✨ 菜单入口改为 `view` 类型，ACL 同步授权 ubus 与 UCI 访问
- 📦 `build.sh` 直接生成 APK v3 包（`*-r1_all.apk`），不再生成 IPK

### 新功能
- ✨ 每条规则可独立启用/禁用（`timeslot.enable`），无需删除；旧规则默认视为启用
- ✨ 规则支持行内直接编辑：星期、时间段、启用状态均可修改
- ♻️ 移除冗余的“规则类型”（允许/禁止），旧配置中的 `rule_type` 将被忽略
- ♻️ **行为变更**：规则改为黑名单语义——列表中的时段禁止上网，其余时间正常放行（原为白名单）

### 使用方式
- 安装命令改为 `apk add --allow-untrusted <package>.apk`
- 卸载命令改为 `apk del luci-app-timecontrol`

---

## v1.2.0 (2025-08-28)

### 新功能
- ✨ 完整的设备时间控制功能
- ✨ 基于MAC地址的精确设备识别
- ✨ 灵活的时间段设置（支持到小时粒度）
- ✨ 周计划管理（周一到周日独立设置）
- ✨ 移动端优化界面设计

### 界面改进
- 🎨 响应式设计，适配手机和平板
- 🎨 周选择采用2列网格布局，触摸友好
- 🎨 添加快捷选择按钮（全选、工作日、周末）
- 🎨 优化时间选择器，使用HTML5原生控件

### 技术特性
- 🔧 使用`raw_prerouting`链，优先级最高
- 🔧 与代理服务（PassWall/OpenClash）完全分离
- 🔧 基于nftables，性能优异
- 🔧 支持规则实时生效

### 兼容性
- ✅ OpenWrt 24.10.1 (主要测试版本)
- ✅ OpenWrt 23.05.x (兼容)
- ✅ 与PassWall/OpenClash/AdGuardHome共存

### 安装包信息
- 📦 包大小: ~12KB
- 📦 架构支持: all (通用架构)
- 📦 依赖: nftables, kmod-nft-core, luci-base

---

## 开发说明

本应用专为管理儿童设备上网时间而开发，可以精确控制智能电视、平板电脑、游戏设备等的网络访问时间。

### 主要用途
- 📺 智能电视时间管理
- 📱 儿童平板使用控制  
- 🎮 游戏设备时间限制
- 🏠 家庭网络设备管理