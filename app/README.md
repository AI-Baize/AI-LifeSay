# AI LifeSay 客户端构建

本仓库的客户端以 Android 0.95（1128）为基准，提供免费 30 场景的运行资源。Android 包名为 `org.aibaize.lifesay`。签名安装包及校验文件通过 GitHub Release 分发。

在 Windows 上将仓库克隆到只含 ASCII 字符的路径，例如 `E:\work\AI-LifeSay`。准备 Node.js 24.19.0、JDK 21 和 Android SDK 36，按本机安装位置设置 `JAVA_HOME` 和 `ANDROID_HOME`。从仓库根目录运行：

```powershell
Set-Location app
npm ci
npm run build
npx cap sync android
Set-Location android
.\gradlew.bat assembleRelease
```

Android 构建产物为 `app/android/app/build/outputs/apk/release/app-release-unsigned.apk`。构建输入包括 Git 中的客户端和课程文件、锁定的 npm 依赖，以及 Gradle 工具和 Android SDK。对用户发放的 APK 需要发行者使用原签名身份签署。

2026-11-09 在 Node 24.19.0、JDK 21、SDK 36 和 Gradle 8.14.3 上通过类型检查、网页构建、Capacitor 同步及 Android release 构建。所得 APK 的 634 个课程文件与 1128 签名候选包一致。构建校验覆盖课程文件内容，不保证两份 APK 字节相同。

正式增值资源的签发及验收由独立服务负责。应用和课程权利见仓库根目录的相关说明，第三方许可见 `THIRD-PARTY-NOTICES.md`。
