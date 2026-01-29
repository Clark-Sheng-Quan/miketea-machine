# Miketea POS Mobile App - Expo

这是一个用 React Native (Expo) 开发的 POS 端 QR 码生成应用，用于测试和集成到真实 POS 系统。

## 项目结构

```
pos-mobile/
├── src/
│   ├── screens/
│   │   └── POSScreen.jsx          # 主 POS 界面
│   └── services/
│       └── qrService.ts           # QR 服务逻辑（React Native 适配版）
├── App.jsx                         # 应用入口
├── app.json                        # Expo 配置
├── package.json                    # 依赖管理
└── README.md                       # 文档
```

## 功能特性

- ✅ 从 API 同步 QR 配置和产品代码
- ✅ 加载订单数据
- ✅ 根据公式生成 QR 码字符串
- ✅ 显示 QR 码预览和完整码
- ✅ 支持本地和远程 API 端点配置
- ✅ AsyncStorage 缓存数据

## 快速开始

### 1. 安装依赖

```bash
cd pos-mobile
npm install
# 或使用 yarn
yarn install
```

### 2. 配置 API 地址

在应用中点击"API Settings"设置后端 API 地址（默认：http://192.168.1.1:3000）

**本地测试提示**：
- 如果后端运行在 Docker，使用你的电脑 IP 地址
- 获取 IP：`ipconfig` (Windows) 或 `ifconfig` (Mac/Linux)
- 例如：http://192.168.x.x:3000

### 3. 启动应用

```bash
# 启动 Expo 开发服务器
npm start

# 选择平台
# 按 a - 启动 Android 模拟器或连接的设备
# 按 i - 启动 iOS 模拟器
# 按 w - 启动 Web 版本
# 按 j - 打开 Debugger
```

### 4. 使用 Android 真机

1. 在手机上安装 Expo Go 应用
2. 在同一 WiFi 网络上扫描 Expo 显示的二维码
3. 应用将在手机上启动

## API 集成

### 需要的后端端点

```
GET /api/service/pos/sync-qr-data?business_id=<ID>
```

返回结构：
```json
{
  "success": true,
  "data": {
    "formula": "#{productCode}|#{optionCodes}",
    "switch": true,
    "productCodes": [
      { "product_id": "PROD001", "code": "A01" }
    ],
    "optionCodes": [
      { "option_id": "OPT001", "option_item_id": "ITEM001", "code": "S1" }
    ]
  }
}
```

## 开发调试

### 查看日志

```bash
# 在 Expo 控制台中查看
npm start
# 然后按 j 打开 Debugger 或使用 React Native Debugger
```

### 清除数据

应用中的"Clear Cache"功能可以清除所有缓存数据并重新开始。

## 常见问题

### Q: 应用无法连接到后端
- 检查你的电脑和手机是否在同一个 WiFi 网络
- 确认后端服务器正在运行
- 使用你的电脑实际 IP 地址，而不是 localhost

### Q: QR 码不显示
- 确保先点击"Sync API Data"获取配置
- 然后"Load Orders"加载订单
- 最后选择订单生成 QR 码

### Q: 模拟器无法访问本地服务
- 使用 `10.0.2.2` 代替 `localhost`（Android）
- 或将地址改为你的电脑 IP

## 生产构建

```bash
# 生成 APK (Android)
eas build --platform android --profile preview

# 生成 IPA (iOS) - 需要 Apple 开发者账户
eas build --platform ios
```

## 文档参考

- [Expo 官方文档](https://docs.expo.dev/)
- [React Native 官方文档](https://reactnative.dev/)
- [React Native QRCode](https://github.com/awesomejerry/react-native-qrcode-svg)

## License

MIT
