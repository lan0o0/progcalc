package com.progcalc.app;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.umeng.commonsdk.UMConfigure;
import com.umeng.union.UMSplashAD;
import com.umeng.union.UMUnionSdk;
import com.umeng.union.api.UMAdConfig;
import com.umeng.union.api.UMUnionApi;

/**
 * 友盟广告 SDK 集成层(开屏 + 浮窗)。
 *
 * 合规说明(友盟官方要求):
 * 1. preInit 可在用户同意协议前调用,仅做准备不采集数据
 * 2. init 必须在用户同意《隐私权政策》后才能调用
 * 3. submitPolicyGrantResult 通知 SDK 用户已授权
 *
 * 初始化流程:
 * - App 启动 → preInit(预初始化,不采集)
 * - 检查协议状态:
 *   - 已同意 → init + submitPolicyGrantResult → 加载开屏广告
 *   - 未同意 → 跳过广告,等前端通知同意后再 init
 */
public final class UMAdSDK {
    private static final String TAG = "ProgCalc.Ad";

    /** 友盟 Appkey */
    private static final String UM_APP_KEY = "6a76a12d934d206f5855c495";
    /** 渠道名 */
    private static final String UM_CHANNEL = "progcalc";
    /** 开屏广告 SlotId */
    private static final String SPLASH_SLOT_ID = "100013102";
    /** 浮窗广告 SlotId */
    private static final String FLOATING_SLOT_ID = "100013101";
    /** 开屏广告超时时间(ms):本地兜底超时,SDK 不回调时强制 goHome */
    private static final long SPLASH_TIMEOUT_MS = 10000L;
    /** 开屏广告最小展示时间(ms):onExposed 后至少展示 5 秒 */
    private static final long SPLASH_MIN_DISPLAY_MS = 5000L;
    /** 浮窗广告自动关闭时间(ms):展示 5 秒后自动移除 */
    private static final long FLOATING_AUTO_CLOSE_MS = 5000L;

    private static volatile boolean preInited = false;
    private static volatile boolean inited = false;

    private UMAdSDK() {}

    /**
     * 预初始化(合规:可在用户同意前调用,仅做准备不采集)。
     * 在 Application/Activity onCreate 中调用。
     */
    public static void preInit(Context context) {
        if (preInited) return;
        try {
            UMConfigure.preInit(context, UM_APP_KEY, UM_CHANNEL);
            preInited = true;
            Log.i(TAG, "UMEng SDK preInit done");
        } catch (Throwable t) {
            Log.e(TAG, "UMEng SDK preInit failed", t);
        }
    }

    /**
     * 正式初始化(合规:必须在用户同意协议后调用)。
     * 调用后 SDK 才会采集数据、加载广告。
     *
     * @param context 上下文
     * @return true 表示初始化成功
     */
    public static boolean init(Context context) {
        if (inited) return true;
        if (!preInited) preInit(context);
        try {
            // 1. 通知友盟用户已同意隐私政策(触发真正初始化)
            UMConfigure.submitPolicyGrantResult(context, true);
            // 2. 初始化广告联盟 SDK
            UMUnionSdk.init(context);
            inited = true;
            Log.i(TAG, "UMEng SDK init done (user agreed)");
            return true;
        } catch (Throwable t) {
            Log.e(TAG, "UMEng SDK init failed", t);
            return false;
        }
    }

    /** SDK 是否已正式初始化(用户同意后) */
    public static boolean isInited() {
        return inited;
    }

    /**
     * 加载开屏广告。
     * 必须在 init() 成功后调用,否则直接回调 onSkip。
     *
     * @param activity Activity
     * @param container 广告容器
     * @param callback 回调
     */
    public static void loadSplashAd(final Activity activity,
                                     final FrameLayout container,
                                     final SplashAdCallback callback) {
        if (!inited) {
            Log.w(TAG, "splash: SDK not inited, skip");
            callback.onSkip();
            return;
        }

        final Handler mainHandler = new Handler(Looper.getMainLooper());
        final Runnable timeout = new SplashTimeoutRunnable(callback);
        mainHandler.postDelayed(timeout, SPLASH_TIMEOUT_MS);

        try {
            UMAdConfig config = new UMAdConfig.Builder()
                    .setSlotId(SPLASH_SLOT_ID)
                    .build();

            // AdLoadListener:加载成功后拿 UMSplashAD 对象(raw type 规避 d8 NPE)
            UMUnionApi.AdLoadListener loadListener =
                    new SplashLoadListener(activity, container, mainHandler, timeout, callback);

            UMUnionSdk.loadSplashAd(config, loadListener, (int) SPLASH_TIMEOUT_MS);
            Log.d(TAG, "splash: loadSplashAd invoked");
        } catch (Throwable t) {
            mainHandler.removeCallbacks(timeout);
            Log.e(TAG, "splash: load failed", t);
            callback.onSkip();
        }
    }

    /**
     * 加载浮窗广告并展示。
     * 必须在 init() 成功后调用,否则静默返回。
     * SDK 3 参版本:loadFloatingBannerAd(Activity, UMAdConfig, AdCloseListener)
     * SDK 内部完成加载与展示,仅需提供关闭回调。
     *
     * @param activity 用于展示浮窗的 Activity
     */
    public static void loadFloatingBannerAd(final Activity activity) {
        if (!inited) {
            Log.w(TAG, "floating: SDK not inited, skip");
            return;
        }

        try {
            UMAdConfig config = new UMAdConfig.Builder()
                    .setSlotId(FLOATING_SLOT_ID)
                    .build();

            UMUnionApi.AdCloseListener closeListener = new FloatingCloseListener();
            UMUnionSdk.loadFloatingBannerAd(activity, config, closeListener);
            Log.d(TAG, "floating: loadFloatingBannerAd invoked");

            // 5 秒后自动关闭浮窗(SDK 3 参版本无主动关闭 API,遍历 DecorView 移除友盟 View)
            new Handler(Looper.getMainLooper()).postDelayed(
                    new FloatingAutoCloseRunnable(activity), FLOATING_AUTO_CLOSE_MS);
        } catch (Throwable t) {
            Log.e(TAG, "floating: load failed", t);
        }
    }

    /** 开屏广告回调 */
    public interface SplashAdCallback {
        void onLoaded();
        void onExposed();
        void onDismissed();
        void onSkip();
    }

    /** 命名 Runnable:开屏广告超时触发 onSkip(避免 Lambda 让 d8 崩溃) */
    static class SplashTimeoutRunnable implements Runnable {
        private final SplashAdCallback callback;
        SplashTimeoutRunnable(SplashAdCallback callback) { this.callback = callback; }
        @Override
        public void run() {
            Log.w(TAG, "splash: timeout, skip");
            callback.onSkip();
        }
    }

    /**
     * 命名 AdLoadListener:开屏广告加载回调(用 raw type 规避 d8 8.2.2 泛型 NPE bug)。
     * - onSuccess:拿到 UMSplashAD,注册 SplashAdListener 后 show(container)
     * - onFailure:取消超时,回调 onSkip
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    static class SplashLoadListener implements UMUnionApi.AdLoadListener {
        private final Activity activity;
        private final FrameLayout container;
        private final Handler mainHandler;
        private final Runnable timeout;
        private final SplashAdCallback callback;

        SplashLoadListener(Activity activity, FrameLayout container,
                           Handler mainHandler, Runnable timeout, SplashAdCallback callback) {
            this.activity = activity;
            this.container = container;
            this.mainHandler = mainHandler;
            this.timeout = timeout;
            this.callback = callback;
        }

        @Override
        public void onSuccess(UMUnionApi.AdType type, UMUnionApi.AdDisplay displayObj) {
            Log.d(TAG, "splash: ad load success, registering listener");
            try {
                UMSplashAD display = (UMSplashAD) displayObj;
                display.setAdEventListener(new SplashEventListener(callback));
                // 必须在 UI 线程 show(用命名 Runnable,避免匿名类让 d8 崩溃)
                activity.runOnUiThread(new SplashShowRunnable(display, container, callback));
            } catch (Throwable t) {
                mainHandler.removeCallbacks(timeout);
                Log.e(TAG, "splash: onSuccess handle failed", t);
                callback.onSkip();
            }
        }

        @Override
        public void onFailure(UMUnionApi.AdType type, String message) {
            mainHandler.removeCallbacks(timeout);
            Log.w(TAG, "splash: ad load failed: " + message);
            callback.onSkip();
        }
    }

    /**
     * 命名 SplashAdListener:开屏广告展示/点击/错误/关闭回调。
     * 继承 AdEventListener:onExposed / onClicked / onError
     * 自身:onDismissed
     *
     * 展示时长控制策略:
     * - onExposed 时启动 5 秒最小展示定时器
     * - 5 秒内收到 SDK 的 onDismissed 不立即 goHome,仅记录日志
     * - 5 秒定时器到期后才真正触发 callback.onDismissed → goHome
     * - 这样即使 SDK 提前 3 秒调用 onDismissed,广告 View 仍保持 5 秒
     * - onError 仍然立即回调(广告展示失败不该阻塞用户)
     */
    static class SplashEventListener implements UMUnionApi.SplashAdListener {
        private final SplashAdCallback callback;
        private volatile boolean dismissed = false;
        private volatile long exposedTime = 0L;

        SplashEventListener(SplashAdCallback callback) { this.callback = callback; }

        @Override
        public void onExposed() {
            exposedTime = System.currentTimeMillis();
            Log.d(TAG, "splash: exposed, start 5s min display timer");
            callback.onExposed();
            // 启动 5 秒最小展示定时器,到期后强制 goHome
            new Handler(Looper.getMainLooper()).postDelayed(
                    new SplashMinDisplayRunnable(this), SPLASH_MIN_DISPLAY_MS);
        }

        @Override
        public void onClicked(View v) {
            Log.d(TAG, "splash: clicked");
        }

        @Override
        public void onError(int code, String msg) {
            Log.w(TAG, "splash: show error " + code + ": " + msg);
            // 广告展示失败,立即 goHome,不阻塞用户
            if (!dismissed) {
                dismissed = true;
                callback.onSkip();
            }
        }

        @Override
        public void onDismissed() {
            long elapsed = exposedTime > 0 ? System.currentTimeMillis() - exposedTime : 0L;
            Log.d(TAG, "splash: SDK onDismissed, displayed=" + elapsed + "ms, waiting for 5s timer");
            // 不立即 goHome!等 5 秒定时器触发
            // 如果已经超过 5 秒(定时器已触发),dismissed 会是 true,这里直接返回
            // 如果不足 5 秒,忽略 SDK 的关闭通知,保持广告 View 显示
        }

        /** 5 秒最小展示定时器到期,真正触发 goHome */
        void onMinDisplayTimeout() {
            if (dismissed) return;
            dismissed = true;
            long elapsed = exposedTime > 0 ? System.currentTimeMillis() - exposedTime : 0L;
            Log.d(TAG, "splash: 5s min display reached, displayed=" + elapsed + "ms, goHome");
            callback.onDismissed();
        }
    }

    /** 命名 Runnable:5 秒最小展示定时器到期触发 goHome */
    static class SplashMinDisplayRunnable implements Runnable {
        private final SplashEventListener listener;
        SplashMinDisplayRunnable(SplashEventListener listener) { this.listener = listener; }
        @Override
        public void run() {
            listener.onMinDisplayTimeout();
        }
    }

    /** 命名 AdCloseListener:浮窗广告关闭回调 */
    static class FloatingCloseListener implements UMUnionApi.AdCloseListener {
        @Override
        public void onClosed(UMUnionApi.AdType type) {
            Log.d(TAG, "floating: closed, type=" + type);
        }
    }

    /**
     * 命名 Runnable:浮窗广告展示 5 秒后自动关闭。
     * SDK 3 参版本 loadFloatingBannerAd 无主动关闭 API,
     * 通过遍历 DecorView 移除友盟浮窗 View 实现。
     * 若 SDK 已自动关闭则找不到 View,安全跳过。
     *
     * 检测策略:遍历 DecorView 全部子孙节点,移除符合以下任一特征的 View:
     * - 类名包含 umeng / ums / union
     * - 是 WebView 且 parent 是 DecorView 系(浮窗通常用 WebView 承载广告)
     */
    static class FloatingAutoCloseRunnable implements Runnable {
        private final Activity activity;
        FloatingAutoCloseRunnable(Activity activity) { this.activity = activity; }
        @Override
        public void run() {
            if (activity.isFinishing() || activity.isDestroyed()) return;
            try {
                ViewGroup decorView = (ViewGroup) activity.getWindow().getDecorView();
                int removed = removeUmengViews(decorView);
                if (removed == 0) {
                    Log.d(TAG, "floating: auto-close no umeng view found (already closed or not shown)");
                } else {
                    Log.d(TAG, "floating: auto-removed " + removed + " umeng view(s)");
                }
            } catch (Throwable t) {
                Log.e(TAG, "floating: auto-close failed", t);
            }
        }

        /** 递归遍历 ViewGroup,移除友盟广告 View,返回移除数量 */
        private int removeUmengViews(ViewGroup parent) {
            int removed = 0;
            for (int i = parent.getChildCount() - 1; i >= 0; i--) {
                View child = parent.getChildAt(i);
                if (child == null) continue;
                String name = child.getClass().getName().toLowerCase();
                // 先递归处理子 ViewGroup(浮窗可能嵌套多层)
                if (child instanceof ViewGroup) {
                    removed += removeUmengViews((ViewGroup) child);
                }
                // 检测友盟 View:类名含 umeng / ums / union
                if (name.contains("umeng") || name.contains("umsdk") || name.contains("union")) {
                    parent.removeView(child);
                    removed++;
                    Log.d(TAG, "floating: auto-removed view: " + child.getClass().getName());
                }
            }
            return removed;
        }
    }

    /** 命名 Runnable:在 UI 线程展示开屏广告(避免匿名类让 d8 崩溃) */
    static class SplashShowRunnable implements Runnable {
        private final UMSplashAD display;
        private final ViewGroup container;
        private final SplashAdCallback callback;

        SplashShowRunnable(UMSplashAD display, ViewGroup container, SplashAdCallback callback) {
            this.display = display;
            this.container = container;
            this.callback = callback;
        }

        @Override
        public void run() {
            try {
                int w = container.getWidth();
                int h = container.getHeight();
                Log.d(TAG, "splash: show, container size=" + w + "x" + h
                        + ", visible=" + container.isShown());
                display.show(container);
                callback.onLoaded();
            } catch (Throwable t) {
                Log.e(TAG, "splash: show failed", t);
                callback.onSkip();
            }
        }
    }
}
