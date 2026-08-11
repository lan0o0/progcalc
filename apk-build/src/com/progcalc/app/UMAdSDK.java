package com.progcalc.app;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import java.lang.reflect.Method;

/**
 * 广告 SDK 集成层(UMUnionSdk 开屏 + 浮窗)。
 *
 * 设计说明:
 * 1. 当前项目尚未引入 UMUnionSdk 的 aar/jar 依赖,直接引用其类会编译失败。
 *    因此本类通过反射方式调用 SDK API,SDK 未接入时所有方法安全降级,
 *    不影响 App 正常运行。
 * 2. 接入 SDK 时,只需把 aar 放到 apk-build/libs/ 并在 build.sh 的 javac
 *    classpath 中加入该 aar 解压后的 classes.jar,即可把反射调用替换为
 *    直接调用(性能更优)。反射调用作为兼容层保留也无副作用。
 * 3. 广告 SlotId 通过常量配置,后续可在服务端下发或本地配置。
 *
 * 合规提醒:
 * 接入广告 SDK 后,SDK 会收集设备信息(IMEI/OAID/IP/位置等)用于广告投放。
 * 必须同步更新「隐私政策」「用户协议」「个人信息收集清单」,如实披露 SDK
 * 名称、收集信息类型、用途、是否回传服务器,否则违反《个人信息保护法》。
 */
public final class UMAdSDK {
    private static final String TAG = "ProgCalc.Ad";

    /** 开屏广告 SlotId —— 接入正式 SDK 时替换为真实值 */
    private static final String SPLASH_SLOT_ID = "your_slot_id";
    /** 浮窗广告 SlotId —— 接入正式 SDK 时替换为真实值 */
    private static final String FLOATING_SLOT_ID = "your_slot_id";
    /** 开屏广告超时时间(ms),超时后跳过进入主页 */
    private static final long SPLASH_TIMEOUT_MS = 5000L;

    private static volatile boolean sdkAvailable = false;
    private static volatile boolean sdkChecked = false;

    private UMAdSDK() {}

    /**
     * 检测 UMUnionSdk 是否已接入(反射查类是否存在)。
     * 结果缓存,避免每次调用都做反射查找。
     */
    public static boolean isAvailable() {
        if (sdkChecked) return sdkAvailable;
        try {
            Class.forName("com.umunion.sdk.UMUnionSdk");
            sdkAvailable = true;
            Log.i(TAG, "UMUnionSdk detected, ad features enabled");
        } catch (ClassNotFoundException e) {
            sdkAvailable = false;
            Log.w(TAG, "UMUnionSdk not integrated, ad features disabled (reflection fallback)");
        }
        sdkChecked = true;
        return sdkAvailable;
    }

    /**
     * 加载开屏广告。
     * SDK 未接入时直接调用 callback.onSkip(),App 正常进入主页。
     *
     * @param activity Activity 上下文(用于展示广告)
     * @param container 开屏广告容器(FrameLayout,广告素材会 add 到此容器)
     * @param callback 广告事件回调
     */
    public static void loadSplashAd(final Activity activity,
                                     final FrameLayout container,
                                     final SplashAdCallback callback) {
        if (!isAvailable()) {
            Log.d(TAG, "splash: SDK unavailable, skip to home");
            callback.onSkip();
            return;
        }

        final Handler mainHandler = new Handler(Looper.getMainLooper());
        // 超时保护:5 秒内未展示广告则跳过
        final Runnable timeout = () -> {
            Log.w(TAG, "splash: timeout, skip to home");
            callback.onSkip();
        };
        mainHandler.postDelayed(timeout, SPLASH_TIMEOUT_MS);

        try {
            // 反射调用等价代码:
            // UMAdConfig config = new UMAdConfig.Builder()
            //     .setSlotId(SPLASH_SLOT_ID).build();
            // UMUnionSdk.loadSplashAd(config, listener, 5000);
            Class<?> builderCls = Class.forName("com.umunion.sdk.UMAdConfig$Builder");
            Object builder = builderCls.newInstance();
            Method setSlotId = builderCls.getMethod("setSlotId", String.class);
            setSlotId.invoke(builder, SPLASH_SLOT_ID);
            Method build = builderCls.getMethod("build");
            final Object config = build.invoke(builder);

            // 构造 AdRenderListener 代理(由于接口类型未知,这里通过反射创建)
            // 实际接入时建议直接实现接口,代码更清晰
            Class<?> sdkCls = Class.forName("com.umunion.sdk.UMUnionSdk");
            Class<?> listenerCls = Class.forName("com.umunion.sdk.UMUnionApi$AdRenderListener");
            Class<?> splashAdCls = Class.forName("com.umunion.sdk.UMSplashAD");

            Object listener = java.lang.reflect.Proxy.newProxyInstance(
                    sdkCls.getClassLoader(),
                    new Class[]{listenerCls},
                    (proxy, method, args) -> {
                        String name = method.getName();
                        mainHandler.removeCallbacks(timeout);
                        if ("onSuccess".equals(name)) {
                            Log.d(TAG, "splash: ad request success");
                            callback.onLoaded();
                        } else if ("onFailure".equals(name)) {
                            Log.w(TAG, "splash: ad request failed: " + args[1]);
                            callback.onSkip();
                        } else if ("onRenderSuccess".equals(name)) {
                            Log.d(TAG, "splash: render success, showing");
                            Object display = args[1];
                            // display.setAdEventListener(listener)
                            // display.show(container)
                            invokeShowSplashAd(activity, container, display, callback);
                        } else if ("onRenderFailure".equals(name)) {
                            Log.w(TAG, "splash: render failed: " + args[1]);
                            callback.onSkip();
                        }
                        return null;
                    });

            Method loadSplash = sdkCls.getMethod("loadSplashAd",
                    config.getClass(), listenerCls, long.class);
            loadSplash.invoke(null, config, listener, SPLASH_TIMEOUT_MS);
            Log.d(TAG, "splash: loadSplashAd invoked");
        } catch (Throwable t) {
            Log.e(TAG, "splash: reflection failed", t);
            mainHandler.removeCallbacks(timeout);
            callback.onSkip();
        }
    }

    /**
     * 调用 UMSplashAD.setAdEventListener + show
     */
    private static void invokeShowSplashAd(final Activity activity,
                                            final FrameLayout container,
                                            final Object display,
                                            final SplashAdCallback callback) {
        try {
            Class<?> splashAdCls = Class.forName("com.umunion.sdk.UMSplashAD");
            Class<?> splashListenerCls = Class.forName(
                    "com.umunion.sdk.UMUnionApi$SplashAdListener");

            Object splashListener = java.lang.reflect.Proxy.newProxyInstance(
                    splashAdCls.getClassLoader(),
                    new Class[]{splashListenerCls},
                    (proxy, method, args) -> {
                        String name = method.getName();
                        if ("onDismissed".equals(name)) {
                            Log.d(TAG, "splash: dismissed");
                            callback.onDismissed();
                        } else if ("onExposed".equals(name)) {
                            Log.d(TAG, "splash: exposed");
                            callback.onExposed();
                        } else if ("onClicked".equals(name)) {
                            Log.d(TAG, "splash: clicked");
                        } else if ("onError".equals(name)) {
                            Log.w(TAG, "splash: show error " + args[0] + ": " + args[1]);
                            callback.onSkip();
                        }
                        return null;
                    });

            // display.setAdEventListener(splashListener)
            Method setListener = splashAdCls.getMethod("setAdEventListener", splashListenerCls);
            setListener.invoke(display, splashListener);
            // display.show(container)
            Method show = splashAdCls.getMethod("show", ViewGroup.class);
            show.invoke(display, container);
        } catch (Throwable t) {
            Log.e(TAG, "splash: invoke show failed", t);
            callback.onSkip();
        }
    }

    /**
     * 加载浮窗广告并展示在 Activity 顶部。
     * SDK 未接入时静默返回,不影响 App 功能。
     *
     * @param activity 用于展示浮窗的 Activity
     */
    public static void loadFloatingBannerAd(final Activity activity) {
        if (!isAvailable()) {
            Log.d(TAG, "floating: SDK unavailable, skip");
            return;
        }

        try {
            // UMAdConfig config = new UMAdConfig.Builder()
            //     .setSlotId(FLOATING_SLOT_ID).build();
            Class<?> builderCls = Class.forName("com.umunion.sdk.UMAdConfig$Builder");
            Object builder = builderCls.newInstance();
            Method setSlotId = builderCls.getMethod("setSlotId", String.class);
            setSlotId.invoke(builder, FLOATING_SLOT_ID);
            Method build = builderCls.getMethod("build");
            final Object config = build.invoke(builder);

            // UMUnionSdk.getApi().loadFloatingBannerAd(activity, config, listener)
            Class<?> sdkCls = Class.forName("com.umunion.sdk.UMUnionSdk");
            Class<?> apiCls = Class.forName("com.umunion.sdk.UMUnionApi");
            Class<?> listenerCls = Class.forName("com.umunion.sdk.UMUnionApi$AdRenderListener");
            Class<?> displayCls = Class.forName("com.umunion.sdk.UMUnionApi$AdDisplay");

            Method getApi = sdkCls.getMethod("getApi");
            Object api = getApi.invoke(null);

            Object listener = java.lang.reflect.Proxy.newProxyInstance(
                    sdkCls.getClassLoader(),
                    new Class[]{listenerCls},
                    (proxy, method, args) -> {
                        String name = method.getName();
                        if ("onSuccess".equals(name)) {
                            Log.d(TAG, "floating: ad request success");
                        } else if ("onFailure".equals(name)) {
                            Log.w(TAG, "floating: ad request failed: " + args[1]);
                        } else if ("onRenderSuccess".equals(name)) {
                            Log.d(TAG, "floating: render success, showing");
                            Object display = args[1];
                            invokeShowFloatingAd(activity, display);
                        } else if ("onRenderFailure".equals(name)) {
                            Log.w(TAG, "floating: render failed: " + args[1]);
                        }
                        return null;
                    });

            Method loadFloating = apiCls.getMethod("loadFloatingBannerAd",
                    Activity.class, config.getClass(), listenerCls);
            loadFloating.invoke(api, activity, config, listener);
            Log.d(TAG, "floating: loadFloatingBannerAd invoked");
        } catch (Throwable t) {
            Log.e(TAG, "floating: reflection failed", t);
        }
    }

    /**
     * 调用 AdDisplay.setAdCloseListener + show
     */
    private static void invokeShowFloatingAd(final Activity activity, final Object display) {
        try {
            Class<?> displayCls = Class.forName("com.umunion.sdk.UMUnionApi$AdDisplay");
            Class<?> closeListenerCls = Class.forName("com.umunion.sdk.UMUnionApi$AdCloseListener");
            if (closeListenerCls == null) {
                // AdCloseListener 接口名猜测,实际接入时按 SDK 文档调整
                closeListenerCls = Class.forName("com.umunion.sdk.UMUnionApi$AdCloseListener");
            }

            // 使用 FunctionalInterface 风格的接口(单方法),用 Proxy 适配
            // display.setAdCloseListener(t -> {});
            Object closeListener = java.lang.reflect.Proxy.newProxyInstance(
                    displayCls.getClassLoader(),
                    closeListenerCls.getInterfaces().length > 0
                            ? closeListenerCls.getInterfaces()
                            : new Class[]{closeListenerCls},
                    (proxy, method, args) -> {
                        Log.d(TAG, "floating: closed");
                        return null;
                    });

            try {
                Method setClose = displayCls.getMethod("setAdCloseListener", closeListenerCls);
                setClose.invoke(display, closeListener);
            } catch (NoSuchMethodException e) {
                Log.w(TAG, "floating: setAdCloseListener method not found, skip");
            }

            // display.show(activity)
            Method show = displayCls.getMethod("show", Activity.class);
            show.invoke(display, activity);
        } catch (Throwable t) {
            Log.e(TAG, "floating: invoke show failed", t);
        }
    }

    /** 开屏广告回调 */
    public interface SplashAdCallback {
        /** 广告素材已加载完成(可用于比价/统计) */
        void onLoaded();
        /** 广告已曝光展示 */
        void onExposed();
        /** 广告关闭(用户看完或点击关闭),进入主页 */
        void onDismissed();
        /** 跳过广告(超时/失败/SDK未接入),直接进入主页 */
        void onSkip();
    }
}
