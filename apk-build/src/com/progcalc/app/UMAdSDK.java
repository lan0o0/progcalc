package com.progcalc.app;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
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

    /** 友盟 Appkey —— 接入正式 SDK 时替换为真实值 */
    private static final String UM_APP_KEY = "YOUR_UMENG_APPKEY";
    /** 渠道名 */
    private static final String UM_CHANNEL = "progcalc";
    /** 开屏广告 SlotId —— 接入正式 SDK 时替换为真实值 */
    private static final String SPLASH_SLOT_ID = "YOUR_SPLASH_SLOT_ID";
    /** 浮窗广告 SlotId —— 接入正式 SDK 时替换为真实值 */
    private static final String FLOATING_SLOT_ID = "YOUR_FLOATING_SLOT_ID";
    /** 开屏广告超时时间(ms) */
    private static final long SPLASH_TIMEOUT_MS = 5000L;

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
        final Runnable timeout = new Runnable() {
            @Override public void run() {
                Log.w(TAG, "splash: timeout, skip");
                callback.onSkip();
            }
        };
        mainHandler.postDelayed(timeout, SPLASH_TIMEOUT_MS);

        try {
            UMAdConfig config = new UMAdConfig.Builder()
                    .setSlotId(SPLASH_SLOT_ID)
                    .build();

            UMUnionSdk.loadSplashAd(config, new UMUnionApi.AdRenderListener<UMSplashAD>() {
                @Override
                public void onSuccess(UMUnionApi.AdType type, UMSplashAD display) {
                    Log.d(TAG, "splash: ad request success");
                }

                @Override
                public void onFailure(UMUnionApi.AdType type, String message) {
                    mainHandler.removeCallbacks(timeout);
                    Log.w(TAG, "splash: ad request failed: " + message);
                    callback.onSkip();
                }

                @Override
                public void onRenderSuccess(UMUnionApi.AdType type, final UMSplashAD display) {
                    mainHandler.removeCallbacks(timeout);
                    Log.d(TAG, "splash: render success, showing");
                    display.setAdEventListener(new UMUnionApi.SplashAdListener() {
                        @Override public void onDismissed() {
                            Log.d(TAG, "splash: dismissed");
                            callback.onDismissed();
                        }
                        @Override public void onExposed() {
                            Log.d(TAG, "splash: exposed");
                            callback.onExposed();
                        }
                        @Override public void onClicked(android.view.View v) {
                            Log.d(TAG, "splash: clicked");
                        }
                        @Override public void onError(int code, String msg) {
                            Log.w(TAG, "splash: show error " + code + ": " + msg);
                            callback.onSkip();
                        }
                    });
                    display.show(container);
                }

                @Override
                public void onRenderFailure(UMUnionApi.AdType type, String message) {
                    mainHandler.removeCallbacks(timeout);
                    Log.w(TAG, "splash: render failed: " + message);
                    callback.onSkip();
                }
            }, (int) SPLASH_TIMEOUT_MS);
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

            UMUnionSdk.loadFloatingBannerAd(activity, config,
                new UMUnionApi.AdRenderListener<UMUnionApi.AdDisplay>() {
                    @Override
                    public void onSuccess(UMUnionApi.AdType type, UMUnionApi.AdDisplay display) {
                        Log.d(TAG, "floating: ad request success");
                    }

                    @Override
                    public void onFailure(UMUnionApi.AdType type, String message) {
                        Log.w(TAG, "floating: ad request failed: " + message);
                    }

                    @Override
                    public void onRenderSuccess(UMUnionApi.AdType type, UMUnionApi.AdDisplay display) {
                        Log.d(TAG, "floating: render success, showing");
                        display.setAdCloseListener(new UMUnionApi.AdCloseListener() {
                            @Override
                            public void onClosed(UMUnionApi.AdType type) {
                                Log.d(TAG, "floating: closed");
                            }
                        });
                        display.show(activity);
                    }

                    @Override
                    public void onRenderFailure(UMUnionApi.AdType type, String message) {
                        Log.w(TAG, "floating: render failed: " + message);
                    }
                });
            Log.d(TAG, "floating: loadFloatingBannerAd invoked");
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
}
