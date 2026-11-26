# LuCI Time Control (luci-app-timecontrol)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/Version-1.3.0-green.svg)](https://github.com/openwrt/luci-app-timecontrol/releases)

一个专为管理儿童上网时间而设计的 OpenWrt LuCI 应用。通过基于设备 MAC 地址的时间控制，让家长能够轻松管理孩子的网络使用时间，如控制看电视、平板电脑等设备的网络访问时间段。

## 🌟 主要特性

### 核心功能
- **设备级时间控制**：基于 MAC 地址精确控制特定设备的网络访问
- **禁止时段模式**：列表中的时间即禁止上网时段，其余时间正常放行
- **规则持久化**：规则写入 fw4 的自动 include 文件，路由器重启或防火墙重载后自动恢复
- **灵活的时间安排**：支持按星期、时间段设置不同的网络访问策略
- **快速规则配置**：提供"工作日"、"周末"、"全选"等快捷选择
- **规则独立启停**：每条规则可单独启用/禁用，无需删除即可临时生效或暂停
- **移动端优化界面**：专为手机操作优化的响应式设计

### 技术特性
- **高优先级处理**：使用 `raw_prerouting` 链确保规则优先执行
- **服务分离**：与代理服务（如 PassWall）完全独立，避免冲突
- **实时生效**：配置更改后立即生效，无需重启路由器
- **资源友好**：基于 nftables，性能优异且资源占用低

### 界面特性
- **直观的设备管理**：一目了然的设备列表和规则展示
- **友好的时间选择**：HTML5 时间选择器，支持各种设备
- **移动端适配**：大按钮设计，2列网格布局，适合手机操作
- **多语言支持**：中文界面，适合国内用户使用

## 🎯 应用场景

### 家庭场景
- **儿童电视时间管理**：控制智能电视、电视盒子的使用时间
- **学习设备管理**：限制平板电脑、学习机的娱乐时间
- **游戏设备控制**：管理游戏主机、掌机的网络访问时间
- **智能设备管理**：控制智能音箱、投影仪等设备的使用时间

### 其他场景
- **办公环境**：限制员工设备在非工作时间的网络访问
- **学校宿舍**：管理学生设备的上网时间
- **公共场所**：控制公共设备的使用时段
- **临时限制**：快速对特定设备实施临时网络限制

## 📋 系统要求

### OpenWrt 版本支持
- ✅ **OpenWrt 25.12** (推荐，原生 APK 包)
- ⚠️ OpenWrt 24.10 及更早版本请使用本项目的旧版 IPK 包

### 重要兼容性说明
本应用已迁移到 LuCI 25.12 的 JavaScript + ucode 架构：界面为纯 JS view，后端通过 rpcd ubus 对象 `luci.timecontrol` 与 UCI 交互。**不再依赖 `luci-compat`，也不需要 Lua 运行时**。软件包格式为 APK v3（apk-tools 3.x），不再提供 IPK。

### 硬件要求
- **RAM**: 最小 64MB (推荐 128MB+)
- **Flash**: 最小 8MB (推荐 16MB+)
- **架构**: 架构无关包（`noarch`），支持所有 OpenWrt 25.12 设备

### 依赖包
- `nftables` - 现代防火墙工具
- `kmod-nft-core` - nftables 内核模块
- `luci-base` - LuCI 基础框架
- `rpcd` - 提供 ubus 后端接口

## 🚀 快速安装

### 方法一：从发布页面下载 (推荐)

1. **下载 APK 包**
   ```bash
   # 架构无关包，适用于所有 OpenWrt 25.12 设备
   wget https://github.com/openwrt/luci-app-timecontrol/releases/download/v1.3.0/luci-app-timecontrol-1.3.0-r1_all.apk
   ```

2. **上传并安装**
   ```bash
   scp luci-app-timecontrol-1.3.0-r1_all.apk root@192.168.1.1:/tmp/
   
   ssh root@192.168.1.1
   apk add --allow-untrusted /tmp/luci-app-timecontrol-1.3.0-r1_all.apk
   ```

### 方法二：从源码构建

1. **克隆仓库**
   ```bash
   git clone https://github.com/openwrt/luci-app-timecontrol.git
   cd luci-app-timecontrol
   ```

2. **构建 APK 包**（构建主机需安装完整版 `apk-tools` 3.x，`build.sh` 会直接输出 `.apk`）
   ```bash
   ./build.sh
   ```

   > 不能直接在 OpenWrt 25.12 路由器上运行：路由器自带的 `apk` 是 minimal 构建，不含 `mkpkg` 子命令。请在 Linux 构建主机上执行。

3. **安装生成的包**
   ```bash
   scp luci-app-timecontrol-1.3.0-r1_all.apk root@192.168.1.1:/tmp/
   ssh root@192.168.1.1 'apk add --allow-untrusted /tmp/luci-app-timecontrol-1.3.0-r1_all.apk'
   ```

## 📱 使用指南

### 1. 访问管理界面

安装完成后，在 LuCI 界面中导航到：
```
网络 → Time Control
```

### 2. 添加设备控制规则

1. **填写设备信息**
   - 设备名称：例如 "Sony电视"、"小明的平板"
   - MAC 地址：设备的网络适配器 MAC 地址

2. **设置时间安排**
   - **快捷选择**：全选、工作日、周末、全不选
   - **时间段**：使用时间选择器设置开始和结束时间

3. **提交规则**
   - 点击"提交"按钮，规则立即生效
   - 规则表示“禁止上网时段”：仅在设定时段内阻断，其他时间正常放行

### 3. 管理现有规则

- **查看规则**：在下方表格中查看所有控制规则及其启用状态
- **启用/禁用规则**：点击规则右侧的"禁用"或"启用"按钮，立即生效且不删除配置
- **删除规则**：点击"删除"按钮移除不需要的规则
- **修改规则**：点击“编辑”按钮直接修改星期、时间段和启用状态，无需删除重建

## 🧪 测试验证

本项目提供了完整的自动化测试方案，确保功能的可靠性：

### Docker 环境测试（推荐用于开发）
```bash
# 快速功能验证
./test-e2e.sh
```

**测试内容：**
- APK 包安装和文件部署
- 服务启动和管理功能
- 配置文件解析和 UCI 集成
- nftables 规则创建和管理
- LuCI 界面集成验证
- 压力测试（多设备规则）

### 真实路由器测试（生产环境验证）
```bash
# 默认连接 192.168.1.1
./test-real-router.sh

# 自定义路由器地址
ROUTER_IP=192.168.4.1 ./test-real-router.sh

# 清理测试环境
./test-real-router.sh cleanup
```

**测试内容：**
- 真实设备的 MAC 地址过滤
- 实际网络封堵效果验证
- 防火墙规则动态切换
- 与现有网络环境兼容性
- LuCI 界面完整功能测试

### 测试报告
测试完成后会生成详细报告：
- `test-report.txt` - Docker 测试报告
- `real-router-test-report.txt` - 真实路由器测试报告

详细的测试指南请参考 [TESTING.md](TESTING.md)

## 🔧 高级配置

### 命令行管理

```bash
# 查看服务状态
/etc/init.d/timecontrol status

# 重新加载规则
/etc/init.d/timecontrol reload

# 停止时间控制
/etc/init.d/timecontrol stop

# 启动时间控制
/etc/init.d/timecontrol start

# 查看当前防火墙规则
nft list chain inet fw4 raw_prerouting
```

### 配置文件位置

- **服务脚本**: `/etc/init.d/timecontrol`
- **配置文件**: `/etc/config/timecontrol`
- **LuCI 视图**: `/www/luci-static/resources/view/timecontrol/main.js`
- **菜单配置**: `/usr/share/luci/menu.d/luci-app-timecontrol.json`
- **ubus 后端**: `/usr/libexec/rpcd/luci.timecontrol`
- **ACL 配置**: `/usr/share/rpcd/acl.d/luci-app-timecontrol.json`

### 示例配置文件

```uci
# /etc/config/timecontrol

config device 'sony_tv'
    option name 'Sony电视'
    option mac '78:11:DC:92:9A:D8'
    option enable '1'

config timeslot 'rule_sony_evening'
    option device 'sony_tv'
    option weekdays 'Mon Tue Wed Thu Fri'
    option start_time '19:00'
    option stop_time '21:00'
    option enable '1'

config timeslot 'rule_sony_weekend'
    option device 'sony_tv'
    option weekdays 'Sat Sun'
    option start_time '14:00'
    option stop_time '18:00'
    option enable '1'
```

## 🛠️ 开发指南

### 项目结构

```
luci-timecontrol/
├── Makefile                                    # OpenWrt 25.12 包构建文件
├── build.sh                                    # 独立 APK 构建脚本
├── README.md                                   # 项目文档
├── htdocs/                                     # 由 luci.mk 安装到 /www
│   └── luci-static/resources/view/timecontrol/
│       └── main.js                             # LuCI JavaScript 视图
└── root/                                       # 原样安装到目标根目录
    ├── etc/
    │   ├── config/
    │   │   └── timecontrol                     # UCI 配置文件
    │   └── init.d/
    │       └── timecontrol                     # 系统服务脚本
    └── usr/
        ├── libexec/rpcd/
        │   └── luci.timecontrol                # rpcd ubus 后端
        └── share/
            ├── luci/menu.d/
            │   └── luci-app-timecontrol.json   # LuCI 菜单配置
            └── rpcd/acl.d/
                └── luci-app-timecontrol.json   # ubus/UCI 权限
```

### 本地开发

1. **修改代码**
   ```bash
   # 编辑相关文件
   vim htdocs/luci-static/resources/view/timecontrol/main.js
   vim root/etc/init.d/timecontrol
   ```

2. **测试构建**
   ```bash
   ./build.sh
   ```

3. **部署测试**
   ```bash
   # 快速部署到测试路由器
   scp luci-app-timecontrol-*.apk root@test-router:/tmp/
   ssh root@test-router 'apk del luci-app-timecontrol; apk add --allow-untrusted /tmp/luci-app-timecontrol-*.apk'
   ```

### 贡献代码

1. Fork 本仓库
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 创建 Pull Request

## 🐛 故障排除

### 常见问题

#### 问题 1: 规则不生效
```bash
# 检查服务状态
/etc/init.d/timecontrol status

# 检查防火墙规则
nft list table inet fw4

# 重新加载规则
/etc/init.d/timecontrol reload
```

#### 问题 2: 与代理冲突
本应用使用 `raw_prerouting` 链，优先级最高，应该不会与 PassWall、OpenClash 等代理软件冲突。如有冲突：

```bash
# 检查链的优先级
nft list chains

# 查看具体规则
nft list chain inet fw4 raw_prerouting
```

#### 问题 3: 移动端界面问题
- 确保使用现代浏览器
- 清除浏览器缓存
- 检查是否启用了 Argon 主题

#### 问题 4: MAC 地址获取
```bash
# 在路由器上查看连接的设备
cat /proc/net/arp
cat /tmp/dhcp.leases
```

### 调试模式

```bash
# 启用调试日志
echo 1 > /sys/kernel/debug/nft_trace

# 查看 nftables 追踪
nft monitor trace

# 查看系统日志
logread | grep timecontrol
```

## 📊 测试环境

本应用已在以下环境中测试验证：

### 测试通过的版本
- ✅ **OpenWrt 25.12** (x86_64) - 主要目标版本（APK v3 + LuCI JS view）
- ⚠️ OpenWrt 24.10 及更早版本请使用 v1.2.0 IPK 包

### 测试设备类型
- 📺 智能电视 (Sony, LG, 小米)
- 📱 移动设备 (iPad, Android 平板)
- 🎮 游戏设备 (Nintendo Switch, PlayStation)
- 📻 流媒体设备 (Roku, Apple TV, 电视盒子)

### 兼容性测试
- 🔄 与 PassWall 共存测试通过
- 🔄 与 OpenClash 共存测试通过  
- 🔄 与 AdGuardHome 共存测试通过
- 🔄 多设备并发控制测试通过

## 🤝 社区支持

### 获取帮助
- 📖 [项目 Wiki](https://github.com/your-repo/luci-app-timecontrol/wiki)
- 🐛 [Issue 跟踪](https://github.com/your-repo/luci-app-timecontrol/issues)
- 💬 [讨论区](https://github.com/your-repo/luci-app-timecontrol/discussions)

### 反馈和建议
欢迎大家：
- 🐛 报告 Bug
- 💡 提出功能建议
- 📝 完善文档
- 🔧 提交代码改进
- ⭐ 给项目点星支持

### 更新计划
- [ ] 支持更细粒度的时间控制（精确到分钟）
- [ ] 添加流量统计功能
- [ ] 支持设备分组管理
- [ ] 增加访问白名单功能
- [ ] 开发移动端 App

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

## 👏 致谢

- [OpenWrt](https://openwrt.org/) 项目提供的优秀路由器系统
- [LuCI](https://github.com/openwrt/luci) 项目提供的 Web 界面框架
- 所有贡献代码和反馈问题的开发者们

---

**⚠️ 免责声明**: 本软件按"原样"提供，不提供任何明示或暗示的保证。使用本软件的风险由用户自行承担。作者不对使用本软件造成的任何损害承担责任。

**🔒 隐私说明**: 本应用仅在本地路由器上运行，不会收集或上传任何用户数据到外部服务器。所有配置和日志都保存在本地设备上。