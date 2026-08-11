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
            // 3. 注册全局广告回调(获取 show/click/failure 等事件,便于排查 error 2010)
            UMUnionSdk.setAdCallback(new GlobalAdCallback());
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
     * 使用 show(ViewGroup container) 展示广告(友盟 SDK 要求)。
     *
     * @param activity  Activity
     * @param container 广告展示容器(必须已 attach 且有尺寸,否则 SDK 会 discard)
     * @param callback  回调
     */
    public static void loadSplashAd(final Activity activity, final ViewGroup container,
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
     *
     * 使用 UMUnionSdk.getApi().loadFloatingBannerAd() 获取 AdLoadListener 回调:
     * - onSuccess:拿到 AdDisplay,手动 show() 展示,并注册关闭监听
     * - onFailure:打印失败原因,便于排查
     *
     * @param activity 用于展示浮窗的 Activity
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    public static void loadFloatingBannerAd(final Activity activity) {
        if (!inited) {
            Log.w(TAG, "floating: SDK not inited, skip");
            return;
        }

        try {
            UMAdConfig config = new UMAdConfig.Builder()
                    .setSlotId(FLOATING_SLOT_ID)
                    .build();

            // 用 getApi() 版本获取 AdLoadListener 回调(raw type 规避 d8 泛型 NPE)
            UMUnionApi.AdLoadListener loadListener = new FloatingLoadListener(activity);
            UMUnionSdk.getApi().loadFloatingBannerAd(activity, config, loadListener);
            Log.d(TAG, "floating: loadFloatingBannerAd invoked (via getApi)");
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
        private final ViewGroup container;
        private final Handler mainHandler;
        private final Runnable timeout;
        private final SplashAdCallback callback;

        SplashLoadListener(Activity activity, ViewGroup container,
                           Handler mainHandler, Runnable timeout, SplashAdCallback callback) {
            this.activity = activity;
            this.container = container;
            this.mainHandler = mainHandler;
            this.timeout = timeout;
            this.callback = callback;
        }

        @Override
        public void onSuccess(UMUnionApi.AdType type, UMUnionApi.AdDisplay displayObj) {
            // 广告加载成功,取消 10 秒加载超时(展示阶段由 5 秒定时器控制)
            mainHandler.removeCallbacks(timeout);
            Log.d(TAG, "splash: ad load success, registering listener");
            try {
                UMSplashAD display = (UMSplashAD) displayObj;
                display.setAdEventListener(new SplashEventListener(callback, activity));
                // 必须在 UI 线程 show(用命名 Runnable,避免匿名类让 d8 崩溃)
                activity.runOnUiThread(new SplashShowRunnable(display, container, callback));
            } catch (Throwable t) {
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
     * 展示时长控制策略(修复 error 2010 导致广告一闪而过):
     * - 构造函数中立即启动 5 秒定时器(不等 onExposed,因为曝光可能失败)
     * - onError(2010):曝光上报失败但广告已展示(visible=true),不 skip,等 5 秒定时器
     * - onError(其他):广告真正无法展示,立即 skip
     * - onDismissed:SDK 提前关闭也不立即 goHome,等 5 秒定时器
     * - 5 秒定时器到期:移除 SDK 广告 View,触发 callback.onDismissed → goHome
     */
    static class SplashEventListener implements UMUnionApi.SplashAdListener {
        private final SplashAdCallback callback;
        private final Activity activity;
        private volatile boolean dismissed = false;
        private volatile long showTime = 0L;

        SplashEventListener(SplashAdCallback callback, Activity activity) {
            this.callback = callback;
            this.activity = activity;
            // 关键修复:在构造函数中启动 5 秒定时器,而非 onExposed
            // 因为 error 2010(expose invalid)时 onExposed 不会被调用
            // 但广告 View 已展示(visible=true),需要保持 5 秒
            showTime = System.currentTimeMillis();
            Log.d(TAG, "splash: listener created, start 5s min display timer (showTime=" + showTime + ")");
            new Handler(Looper.getMainLooper()).postDelayed(
                    new SplashMinDisplayRunnable(this), SPLASH_MIN_DISPLAY_MS);
        }

        @Override
        public void onExposed() {
            Log.d(TAG, "splash: exposed (5s timer already running from constructor)");
            callback.onExposed();
        }

        @Override
        public void onClicked(View v) {
            Log.d(TAG, "splash: clicked");
        }

        @Override
        public void onError(int code, String msg) {
            Log.w(TAG, "splash: show error " + code + ": " + msg);
            // Error 2010 (expose invalid / report fail):
            // 广告 View 已展示(visible=true),只是曝光上报失败
            // 不 skip!让 5 秒定时器到期后正常 goHome
            if (code == 2010) {
                Log.d(TAG, "splash: error 2010 non-fatal, ad visible, keep 5s timer");
                return;
            }
            // 其他错误:广告真正无法展示
            // 如果还没展示(showTime==0 不可能,构造函数已设),立即 skip
            if (!dismissed) {
                dismissed = true;
                callback.onSkip();
            }
        }

        @Override
        public void onDismissed() {
            long elapsed = showTime > 0 ? System.currentTimeMillis() - showTime : 0L;
            Log.d(TAG, "splash: SDK onDismissed, displayed=" + elapsed + "ms, waiting for 5s timer");
            // 不立即 goHome!等 5 秒定时器触发
        }

        /** 5 秒最小展示定时器到期,真正触发 goHome */
        void onMinDisplayTimeout() {
            if (dismissed) return;
            dismissed = true;
            long elapsed = System.currentTimeMillis() - showTime;
            Log.d(TAG, "splash: 5s min display reached, displayed=" + elapsed + "ms, goHome");
            // show(activity) 模式下 SDK 广告 View 在 DecorView 上,需要手动移除
            removeAdViews(activity);
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

    /**
     * 命名 AdLoadListener:浮窗广告加载回调(用 raw type 规避 d8 泛型 NPE)。
     * - onSuccess:拿到 AdDisplay,注册关闭监听 + show() 展示,启动 5 秒自动关闭定时器
     * - onFailure:打印失败原因(原来 3 参版本无此回调,加载失败时静默无日志)
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    static class FloatingLoadListener implements UMUnionApi.AdLoadListener {
        private final Activity activity;

        FloatingLoadListener(Activity activity) { this.activity = activity; }

        @Override
        public void onSuccess(UMUnionApi.AdType type, UMUnionApi.AdDisplay displayObj) {
            Log.d(TAG, "floating: ad load success, show + start 5s auto-close timer");
            try {
                // 注册关闭监听
                displayObj.setAdCloseListener(new FloatingCloseListener());
                // show() 展示广告(SDK 会将广告 View 添加到 DecorView)
                displayObj.show(activity);
                // 5 秒后自动关闭(遍历 DecorView 移除友盟 View)
                new Handler(Looper.getMainLooper()).postDelayed(
                        new FloatingAutoCloseRunnable(activity), FLOATING_AUTO_CLOSE_MS);
                // 延迟 500ms 设置摇一摇阈值(广告 View 添加到 DecorView 后才能找到)
                new Handler(Looper.getMainLooper()).postDelayed(
                        new FloatingShakeRunnable(activity), 500L);
            } catch (Throwable t) {
                Log.e(TAG, "floating: show failed", t);
            }
        }

        @Override
        public void onFailure(UMUnionApi.AdType type, String message) {
            Log.w(TAG, "floating: ad load failed: " + message);
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
     * 全局广告回调:捕获所有广告类型的 show/click/failure 事件。
     * 主要用于排查 error 2010(expose invalid)的根因:
     * SDK 内部曝光上报失败时会调用 onFailure,此处打印详细信息。
     */
    static class GlobalAdCallback extends UMUnionApi.AdCallback {
        @Override
        public void onShow(UMUnionApi.AdType type) {
            Log.d(TAG, "global: ad show, type=" + type);
        }

        @Override
        public void onClicked(UMUnionApi.AdType type) {
            Log.d(TAG, "global: ad clicked, type=" + type);
        }

        @Override
        public void onFailure(UMUnionApi.AdType type, String message) {
            Log.w(TAG, "global: ad failure, type=" + type + ", msg=" + message);
        }
    }

    /**
     * 从 DecorView 移除友盟广告 View(开屏 + 浮窗共用)。
     * show(activity) 模式下 SDK 将广告 View 添加到 DecorView,
     * 需手动遍历移除。检测类名含 umeng / umsdk / union 的 View。
     *
     * @param activity Activity
     * @return 移除的 View 数量
     */
    static int removeAdViews(Activity activity) {
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) return 0;
        int removed = 0;
        try {
            ViewGroup decorView = (ViewGroup) activity.getWindow().getDecorView();
            removed = removeUmengViewsRecursive(decorView);
        } catch (Throwable t) {
            Log.e(TAG, "removeAdViews failed", t);
        }
        return removed;
    }

    /** 递归遍历 ViewGroup,移除友盟广告 View,返回移除数量 */
    private static int removeUmengViewsRecursive(ViewGroup parent) {
        int removed = 0;
        for (int i = parent.getChildCount() - 1; i >= 0; i--) {
            View child = parent.getChildAt(i);
            if (child == null) continue;
            String name = child.getClass().getName().toLowerCase();
            // 先递归处理子 ViewGroup(广告可能嵌套多层)
            if (child instanceof ViewGroup) {
                removed += removeUmengViewsRecursive((ViewGroup) child);
            }
            // 检测友盟 View:类名含 umeng / umsdk / union
            if (name.contains("umeng") || name.contains("umsdk") || name.contains("union")) {
                parent.removeView(child);
                removed++;
                Log.d(TAG, "removed ad view: " + child.getClass().getName());
            }
        }
        return removed;
    }

    /**
     * 设置广告摇一摇阈值(通过反射调用 SDK 内部 j0.a(float))。
     *
     * 友盟 SDK 默认阈值 20.0f(约 2g 加速度),需要较大幅度摇动才触发。
     * 此方法遍历 DecorView 中的广告 View,通过反射查找 j0 实例并调用 a(float)
     * 降低阈值,实现"稍微摇动就跳转广告"。
     *
     * 实现原理:
     * - SDK 的 j0 类(internal 包,不对外暴露)实现 SensorEventListener
     * - j0.a(float threshold) 方法设置震动阈值(限制 0 < threshold < 20.0f)
     * - j0 实例被 H / V0 / p 等类持有,这些类实例是广告 View 的成员
     * - 通过反射遍历广告 View 的字段树,找到 j0 实例后调用 a(float)
     *
     * @param activity Activity
     * @param threshold 阈值(m/s²),建议 5~15,越小越敏感
     * @return 是否成功设置
     */
    static boolean setShakeThreshold(Activity activity, float threshold) {
        if (activity == null || activity.isFinishing() || activity.isDestroyed()) return false;
        try {
            Class<?> j0Class = Class.forName("com.umeng.union.internal.j0");
            java.lang.reflect.Method setMethod = j0Class.getDeclaredMethod("a", float.class);
            setMethod.setAccessible(true);

            ViewGroup decorView = (ViewGroup) activity.getWindow().getDecorView();
            int count = setShakeThresholdRecursive(decorView, j0Class, setMethod, threshold);
            if (count > 0) {
                Log.d(TAG, "shake: threshold set to " + threshold + " for " + count + " ad view(s)");
                return true;
            } else {
                Log.d(TAG, "shake: no j0 instance found in ad views");
                return false;
            }
        } catch (Throwable t) {
            Log.e(TAG, "shake: set threshold failed", t);
            return false;
        }
    }

    /**
     * 递归遍历 View 树,查找 j0 实例并设置阈值。
     * 查找策略:对每个 View 及其字段(递归到 3 层深度)查找 j0 类型字段。
     */
    private static int setShakeThresholdRecursive(View view, Class<?> j0Class,
                                                   java.lang.reflect.Method setMethod,
                                                   float threshold) {
        int count = 0;
        if (view == null) return 0;

        // 先在当前 View 的字段中查找 j0 实例
        count += findAndSetJ0InFields(view, j0Class, setMethod, threshold, 0);

        // 递归处理子 View
        if (view instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) view;
            for (int i = 0; i < group.getChildCount(); i++) {
                count += setShakeThresholdRecursive(group.getChildAt(i), j0Class, setMethod, threshold);
            }
        }
        return count;
    }

    /**
     * 在对象的字段中递归查找 j0 实例(最多 3 层深度)。
     * 找到后调用 a(float) 设置阈值。
     */
    private static int findAndSetJ0InFields(Object obj, Class<?> j0Class,
                                             java.lang.reflect.Method setMethod,
                                             float threshold, int depth) {
        if (obj == null || depth > 3) return 0;
        int count = 0;

        try {
            Class<?> clazz = obj.getClass();
            // 遍历当前类及父类的所有字段
            while (clazz != null && clazz != Object.class) {
                for (java.lang.reflect.Field field : clazz.getDeclaredFields()) {
                    field.setAccessible(true);
                    Object value = field.get(obj);
                    if (value == null) continue;

                    // 直接是 j0 实例
                    if (j0Class.isInstance(value)) {
                        try {
                            setMethod.invoke(value, threshold);
                            count++;
                            Log.d(TAG, "shake: set threshold on " + clazz.getName() + "." + field.getName());
                        } catch (Throwable t) {
                            Log.w(TAG, "shake: invoke a(float) failed on " + field.getName(), t);
                        }
                    }
                    // 递归查找非基本类型字段(避免 String/Context 等无意义递归)
                    else if (depth < 3 && !value.getClass().isPrimitive()
                             && !value.getClass().getName().startsWith("android.")
                             && !value.getClass().getName().startsWith("java.")) {
                        count += findAndSetJ0InFields(value, j0Class, setMethod, threshold, depth + 1);
                    }
                }
                clazz = clazz.getSuperclass();
            }
        } catch (Throwable t) {
            // 忽略反射异常
        }
        return count;
    }

    /**
     * 命名 Runnable:浮窗广告展示 5 秒后自动关闭。
     * SDK 3 参版本 loadFloatingBannerAd 无主动关闭 API,
     * 通过遍历 DecorView 移除友盟浮窗 View 实现。
     */
    static class FloatingAutoCloseRunnable implements Runnable {
        private final Activity activity;
        FloatingAutoCloseRunnable(Activity activity) { this.activity = activity; }
        @Override
        public void run() {
            int removed = removeAdViews(activity);
            if (removed == 0) {
                Log.d(TAG, "floating: auto-close no umeng view found (already closed or not shown)");
            } else {
                Log.d(TAG, "floating: auto-removed " + removed + " umeng view(s)");
            }
        }
    }

    /** 命名 Runnable:延迟设置浮窗广告摇一摇阈值 */
    static class FloatingShakeRunnable implements Runnable {
        private final Activity activity;
        FloatingShakeRunnable(Activity activity) { this.activity = activity; }
        @Override
        public void run() {
            // 阈值 8.0f(约 0.8g),比默认 20.0f 灵敏很多
            setShakeThreshold(activity, 8.0f);
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
                if (container == null) {
                    Log.w(TAG, "splash: container is null, skip");
                    callback.onSkip();
                    return;
                }
                // 友盟 SDK 要求 show(ViewGroup container),不能传 Activity
                // 打印 container 尺寸,便于排查 2003 discard
                Log.d(TAG, "splash: show via show(container), size="
                        + container.getWidth() + "x" + container.getHeight());
                display.show(container);
                callback.onLoaded();
                // show 后广告 View 已添加到 container,延迟 500ms 让 SDK 完成初始化
                // 然后通过反射设置摇一摇阈值(降低灵敏度,稍微摇动就跳转)
                new Handler(Looper.getMainLooper()).postDelayed(new SplashShakeRunnable(container), 500L);
            } catch (Throwable t) {
                Log.e(TAG, "splash: show failed", t);
                callback.onSkip();
            }
        }
    }

    /** 命名 Runnable:延迟设置开屏广告摇一摇阈值 */
    static class SplashShakeRunnable implements Runnable {
        private final ViewGroup container;
        SplashShakeRunnable(ViewGroup container) { this.container = container; }
        @Override
        public void run() {
            // 阈值 8.0f(约 0.8g),比默认 20.0f 灵敏很多
            setShakeThresholdOnContainer(container, 8.0f);
        }
    }

    /**
     * 在指定 container 中查找 j0 实例并设置摇一摇阈值。
     * 用于开屏广告(show(container) 模式,广告 View 在 container 中)。
     */
    private static void setShakeThresholdOnContainer(ViewGroup container, float threshold) {
        try {
            Class<?> j0Class = Class.forName("com.umeng.union.internal.j0");
            java.lang.reflect.Method setMethod = j0Class.getDeclaredMethod("a", float.class);
            setMethod.setAccessible(true);
            int count = setShakeThresholdRecursive(container, j0Class, setMethod, threshold);
            if (count > 0) {
                Log.d(TAG, "shake: threshold set to " + threshold + " for " + count + " ad view(s)");
            } else {
                Log.d(TAG, "shake: no j0 instance found in container");
            }
        } catch (Throwable t) {
            Log.e(TAG, "shake: set threshold on container failed", t);
        }
    }
}
