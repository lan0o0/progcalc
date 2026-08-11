#!/bin/bash
set -e

export ANDROID_HOME=/opt/android-sdk
export BT=$ANDROID_HOME/build-tools/34.0.0
export PLATFORM=$ANDROID_HOME/platforms/android-34
export KS=/workspace/android/progcalc.keystore

cd /workspace/apk-build
mkdir -p compiled-res obj out

echo "=== 1. 编译资源 (aapt2 compile) ==="
$BT/aapt2 compile --dir res -o compiled-res/

echo "=== 2. 链接资源生成基础 APK (aapt2 link) ==="
FLAT_ARGS=""
for f in compiled-res/*.flat; do
  FLAT_ARGS="$FLAT_ARGS -R $f"
done
$BT/aapt2 link \
  -o out/base.apk \
  -I $PLATFORM/android.jar \
  --manifest AndroidManifest.xml \
  -A assets \
  $FLAT_ARGS \
  --auto-add-overlay \
  --min-sdk-version 24 \
  --target-sdk-version 34 \
  --no-compress-regex '\.(html|js|css|svg|webmanifest|json|png)$'

echo "=== 3. 编译 Java (javac, source/target 11) ==="
# 编译所有 .java 文件(MainActivity + UMAdSDK + AppBridge 等)
# source/target 11:d8 8.2.2 处理 release 8 字节码会 NPE,用 11 兼容
javac --release 11 \
  -cp $PLATFORM/android.jar \
  -d obj \
  $(find src -name "*.java")

echo "=== 4. 转换为 dex (d8) ==="
$BT/d8 \
  --release \
  --lib $PLATFORM/android.jar \
  --output out/ \
  $(find obj -name "*.class")

echo "=== 5. 合并 dex 到 APK ==="
cd out
zip -j base.apk classes.dex
cd ..

echo "=== 6. 对齐 (zipalign) ==="
$BT/zipalign -f 4 out/base.apk out/aligned.apk

echo "=== 7. 签名 (apksigner) ==="
$BT/apksigner sign \
  --ks $KS \
  --ks-pass pass:progcalc123 \
  --ks-key-alias progcalc \
  --key-pass pass:progcalc123 \
  --out out/programmer-calculator.apk \
  out/aligned.apk

echo "=== 完成 ==="
ls -lh out/programmer-calculator.apk
