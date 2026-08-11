#!/bin/bash
set -e

export ANDROID_HOME=/opt/android-sdk
export BT=$ANDROID_HOME/build-tools/34.0.0
export PLATFORM=$ANDROID_HOME/platforms/android-34
export KS=/workspace/android/progcalc.keystore

cd /workspace/apk-build
mkdir -p compiled-res obj out libs/extracted generated-java
# 清空上次的编译产物(避免残留的匿名类 class 导致 d8 崩溃)
rm -f obj/com/progcalc/app/*.class
rm -f out/*.apk out/*.dex
rm -rf generated-java/*
rm -rf obj/com/umeng

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
# 清空旧产物
rm -f compiled-res/*.flat
# 编译本应用的 res
$BT/aapt2 compile --dir res -o compiled-res/
# 编译友盟 SDK 的 res(union 模块有 layout/drawable 等资源,必须打包进 APK)
mkdir -p compiled-res/sdk
for d in libs/extracted/*/res; do
  if [ -d "$d" ]; then
    name=$(basename $(dirname $d))
    mkdir -p compiled-res/sdk/$name
    $BT/aapt2 compile --dir "$d" -o compiled-res/sdk/$name/ || true
  fi
done

echo "=== 2. 链接资源生成基础 APK (aapt2 link) ==="
FLAT_ARGS=""
for f in compiled-res/*.flat; do
  FLAT_ARGS="$FLAT_ARGS -R $f"
done
# 把 SDK 的 .flat 也加进来
for f in compiled-res/sdk/*/*.flat; do
  [ -f "$f" ] && FLAT_ARGS="$FLAT_ARGS -R $f"
done
# 友盟 SDK 的 R 类需要生成在对应包名下
EXTRA_PKGS=""
for d in libs/extracted/*/res; do
  if [ -d "$d" ]; then
    # 把目录名(如 union-3.7.1)的版本号去掉作为包名友盟 SDK 的 R 类包名
    name=$(basename $(dirname $d))
    pkg=$(echo "$name" | sed 's/-[0-9].*//')
    EXTRA_PKGS="$EXTRA_PKGS --extra-packages com.umeng.$pkg"
  fi
done
$BT/aapt2 link \
  -o out/base.apk \
  -I $PLATFORM/android.jar \
  --manifest AndroidManifest.xml \
  -A assets \
  $FLAT_ARGS \
  $EXTRA_PKGS \
  --java generated-java/ \
  --auto-add-overlay \
  --min-sdk-version 24 \
  --target-sdk-version 34 \
  --no-compress-regex '\.(html|js|css|svg|webmanifest|json|png|so)$'

echo "=== 生成的 R.java 文件 ==="
find generated-java -name "*.java" 2>/dev/null | head -10

echo "=== 3. 编译 Java (javac) ==="
# 清空旧产物
rm -f obj/com/progcalc/app/*.class obj/com/umeng/**/*.class 2>/dev/null
# 收集所有 Java 源文件(应用源码 + aapt2 生成的 R.java)
JAVA_SRCS=$(find src -name "*.java")
if [ -d generated-java ]; then
  JAVA_SRCS="$JAVA_SRCS $(find generated-java -name '*.java')"
fi
javac --release 11 \
  -cp "$PLATFORM/android.jar$SDK_CP" \
  -d obj \
  $JAVA_SRCS

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
