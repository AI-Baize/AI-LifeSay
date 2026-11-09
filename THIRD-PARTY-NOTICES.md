# 1128 第三方依赖与许可清单（待最终核验）

本清单根据 1128 Android release 构建的 package 依赖图和构建环境 npm 生产依赖树生成，记录候选依赖而非断言均保留在最终编译字节码。课程、图片、音频和字体权利另行核验。

## Web 与 Capacitor npm 生产依赖

| 组件 | 版本 | 声明许可 | 随附文件 |
|---|---|---|---|
| @capacitor/android | 8.5.2 | MIT | [文本](third-party-licenses/_capacitor_android-8.5.2-LICENSE) |
| @capacitor/app | 8.1.2 | MIT | [文本](third-party-licenses/_capacitor_app-8.1.2-LICENSE) |
| @capacitor/core | 8.5.2 | MIT | [文本](third-party-licenses/_capacitor_core-8.5.2-LICENSE) |
| @remix-run/router | 1.23.4 | MIT | [文本](third-party-licenses/_remix-run_router-1.23.4-LICENSE.md) |
| dexie | 4.4.6 | Apache-2.0 | [文本](third-party-licenses/dexie-4.4.6-LICENSE), [文本](third-party-licenses/dexie-4.4.6-NOTICE) |
| react | 19.3.0 | MIT | [文本](third-party-licenses/react-19.3.0-LICENSE) |
| react-dom | 19.3.0 | MIT | [文本](third-party-licenses/react-dom-19.3.0-LICENSE) |
| react-router | 6.30.6 | MIT | [文本](third-party-licenses/react-router-6.30.6-LICENSE.md) |
| react-router-dom | 6.30.6 | MIT | [文本](third-party-licenses/react-router-dom-6.30.6-LICENSE.md) |
| scheduler | 0.28.0 | MIT | [文本](third-party-licenses/scheduler-0.28.0-LICENSE) |
| tslib | 2.8.1 | 0BSD | [文本](third-party-licenses/tslib-2.8.1-LICENSE.txt) |
| zustand | 5.0.15 | MIT | [文本](third-party-licenses/zustand-5.0.15-LICENSE) |

## Android release 打包依赖

| 组件 | POM 声明许可 |
|---|---|
| androidx.activity:activity:1.11.0 | The Apache Software License, Version 2.0 |
| androidx.annotation:annotation-experimental:1.4.1 | The Apache Software License, Version 2.0 |
| androidx.annotation:annotation-jvm:1.8.1 | The Apache Software License, Version 2.0 |
| androidx.appcompat:appcompat-resources:1.7.1 | The Apache Software License, Version 2.0 |
| androidx.appcompat:appcompat:1.7.1 | The Apache Software License, Version 2.0 |
| androidx.arch.core:core-common:2.2.0 | The Apache Software License, Version 2.0 |
| androidx.arch.core:core-runtime:2.2.0 | The Apache Software License, Version 2.0 |
| androidx.collection:collection-jvm:1.4.2 | The Apache Software License, Version 2.0 |
| androidx.concurrent:concurrent-futures:1.1.0 | The Apache Software License, Version 2.0 |
| androidx.coordinatorlayout:coordinatorlayout:1.3.0 | The Apache Software License, Version 2.0 |
| androidx.core:core-ktx:1.17.0 | The Apache Software License, Version 2.0 |
| androidx.core:core-splashscreen:1.2.0 | The Apache Software License, Version 2.0 |
| androidx.core:core-viewtree:1.0.0 | The Apache Software License, Version 2.0 |
| androidx.core:core:1.17.0 | The Apache Software License, Version 2.0 |
| androidx.cursoradapter:cursoradapter:1.0.0 | The Apache Software License, Version 2.0 |
| androidx.customview:customview:1.0.0 | The Apache Software License, Version 2.0 |
| androidx.drawerlayout:drawerlayout:1.0.0 | The Apache Software License, Version 2.0 |
| androidx.emoji2:emoji2-views-helper:1.3.0 | The Apache Software License, Version 2.0 |
| androidx.emoji2:emoji2:1.3.0 | The Apache Software License, Version 2.0 |
| androidx.fragment:fragment:1.8.9 | The Apache Software License, Version 2.0 |
| androidx.interpolator:interpolator:1.0.0 | The Apache Software License, Version 2.0 |
| androidx.lifecycle:lifecycle-common:2.6.2 | The Apache Software License, Version 2.0 |
| androidx.lifecycle:lifecycle-livedata-core:2.6.2 | The Apache Software License, Version 2.0 |
| androidx.lifecycle:lifecycle-livedata:2.6.2 | The Apache Software License, Version 2.0 |
| androidx.lifecycle:lifecycle-process:2.6.2 | The Apache Software License, Version 2.0 |
| androidx.lifecycle:lifecycle-runtime:2.6.2 | The Apache Software License, Version 2.0 |
| androidx.lifecycle:lifecycle-viewmodel-savedstate:2.6.2 | The Apache Software License, Version 2.0 |
| androidx.lifecycle:lifecycle-viewmodel:2.6.2 | The Apache Software License, Version 2.0 |
| androidx.loader:loader:1.0.0 | The Apache Software License, Version 2.0 |
| androidx.profileinstaller:profileinstaller:1.4.0 | The Apache Software License, Version 2.0 |
| androidx.resourceinspection:resourceinspection-annotation:1.0.1 | The Apache Software License, Version 2.0 |
| androidx.savedstate:savedstate:1.2.1 | The Apache Software License, Version 2.0 |
| androidx.startup:startup-runtime:1.1.1 | The Apache Software License, Version 2.0 |
| androidx.tracing:tracing:1.2.0 | The Apache Software License, Version 2.0 |
| androidx.vectordrawable:vectordrawable-animated:1.1.0 | The Apache Software License, Version 2.0 |
| androidx.vectordrawable:vectordrawable:1.1.0 | The Apache Software License, Version 2.0 |
| androidx.versionedparcelable:versionedparcelable:1.1.1 | The Apache Software License, Version 2.0 |
| androidx.viewpager:viewpager:1.0.0 | The Apache Software License, Version 2.0 |
| androidx.webkit:webkit:1.14.0 | The Apache Software License, Version 2.0 |
| com.google.guava:listenablefuture:1.0 | Apache License 2.0（继承 guava-parent 26.0-android 的 POM） |
| org.apache.cordova:framework:14.0.1 | Apache License, Version 2.0 |
| org.jetbrains.kotlin:kotlin-stdlib:2.0.21 | The Apache License, Version 2.0 |
| org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1 | The Apache Software License, Version 2.0 |
| org.jetbrains.kotlinx:kotlinx-coroutines-core-jvm:1.8.1 | The Apache Software License, Version 2.0 |
| org.jetbrains:annotations:23.0.0 | The Apache Software License, Version 2.0 |
| org.jspecify:jspecify:1.0.0 | The Apache License, Version 2.0 |

## 尚需完成

- `com.google.guava:listenablefuture:1.0` 的许可来自本地父 POM guava-parent 26.0-android；仍需核对产物是否包含额外 NOTICE。
- 核对 Android AAR/JAR 内附 NOTICE、版权声明及各许可证全文；当前 POM 清单不等于完整合规通知。
- 确认网页依赖中的间接依赖与实际构建产物的对应关系，并核对字体、图片和音频的许可及署名。
- 源码与课程内容的使用条款独立适用。

## Android 工件中附带的许可与 NOTICE

- androidx.activity:activity:1.11.0：[文本](third-party-licenses/androidx.activity-activity-1.11.0-META-INF_androidx_activity_activity_LICENSE.txt)
- androidx.coordinatorlayout:coordinatorlayout:1.3.0：[文本](third-party-licenses/androidx.coordinatorlayout-coordinatorlayout-1.3.0-META-INF_androidx_coordinatorlayout_coordinatorlayout_LICENSE.txt)
- androidx.core:core-ktx:1.17.0：[文本](third-party-licenses/androidx.core-core-ktx-1.17.0-META-INF_androidx_core_core-ktx_LICENSE.txt)
- androidx.core:core-splashscreen:1.2.0：[文本](third-party-licenses/androidx.core-core-splashscreen-1.2.0-META-INF_androidx_core_core-splashscreen_LICENSE.txt)
- androidx.core:core-viewtree:1.0.0：[文本](third-party-licenses/androidx.core-core-viewtree-1.0.0-META-INF_androidx_core_core-viewtree_LICENSE.txt)
- androidx.core:core:1.17.0：[文本](third-party-licenses/androidx.core-core-1.17.0-META-INF_androidx_core_core_LICENSE.txt)
- androidx.profileinstaller:profileinstaller:1.4.0：[文本](third-party-licenses/androidx.profileinstaller-profileinstaller-1.4.0-META-INF_androidx_profileinstaller_profileinstaller_LICENSE.txt)
- androidx.webkit:webkit:1.14.0：[文本](third-party-licenses/androidx.webkit-webkit-1.14.0-META-INF_androidx_webkit_webkit_LICENSE.txt)

Apache License 2.0 完整文本： [Dexie 随附许可](third-party-licenses/dexie-4.4.6-LICENSE)。

