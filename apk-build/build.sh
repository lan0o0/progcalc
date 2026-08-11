#!/bin/bash
set -e

export ANDROID_HOME=/opt/android-sdk
export BT=$ANDROID_HOME/build-tools/34.0.0
export PLATFORM=$ANDROID_HOME/platforms/android-34
export KS=/workspace/android/progcalc.keystore

cd /workspace/apk-build
mkdir -p compiled-res obj out libs/extracted

echo "=== 0. 解压友盟 SDK aar ==="
for aar in libs/*.aar; do
  name=$(basename "$aar" .aar)
  if [ ! -d "libs/extracted/$name" ]; then
    mkdir -p "libs/extracted/$name"
    cd "libs/extracted/$name"
    unzip -o "../../$(basename $aar)" > /dev/null 2>&1
    cd /workspace/apk-build
  fi
done

# 构造 SDK classpath(所有 classes.jar)
SDK_CP=""
for jar in libs/extracted/*/classes.jar; do
  SDK_CP="$SDK_CP:$jar"
done

echo "=== 1. 编译资源 (aapt2 compile) ==="
$BT/aapt2 compile --dir res -o compiled-res/

echo "=== 2. 链接资源生成基础 APK (aapt2 link) ==="
FLAT_ARGS=""
for f in compiled-res/*.flat; do
  FLAT_ARGS="$FLAT_ARGS -R $f"
done
# 合并友盟 SDK 的 res(union 模块有 drawable 等资源)
SDK_RES_DIRS=""
for d in libs/extracted/*/res; do
  if [ -d "$d" ]; then
    SDK_RES_DIRS="$SDK_RES_DIRS --extra-packages $(basename $(dirname $d))"
  fi
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
  --no-compress-regex '\.(html|js|css|svg|webmanifest|json|png|so)$'

echo "=== 3. 编译 Java (javac) ==="
javac --release 11 \
  -cp "$PLATFORM/android.jar$SDK_CP" \
  -d obj \
  $(find src -name "*.java")

echo "=== 4. 转换为 dex (d8) ==="
# 收集所有 .class 和 SDK 的 classes.jar
D8_INPUTS=$(find obj -name "*.class")
for jar in libs/extracted/*/classes.jar; do
  D8_INPUTS="$D8_INPUTS $jar"
done
$BT/d8 \
  --release \
  --lib $PLATFORM/android.jar \
  --output out/ \
  $D8_INPUTS

echo "=== 5. 合并 dex 和 .so 到 APK ==="
cd out
zip -j base.apk classes.dex
# 打包友盟 SDK 的 native .so 文件(asms 模块有 libumeng-spy.so)
cd /workspace/apk-build
for so in libs/extracted/*/jni/*/*.so; do
  if [ -f "$so" ]; then
    arch=$(basename $(dirname $so))
    cd out
    mkdir -p lib/$arch
    cp /workspace/apk-build/$so lib/$arch/
    zip -r base.apk lib/ > /dev/null
    cd /workspace/apk-build
  fi
done

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
