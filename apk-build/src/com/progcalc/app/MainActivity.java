package com.progcalc.app;

import android.app.Activity;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.webkit.ConsoleMessage;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

public class MainActivity extends Activity {
    private static final String TAG = "ProgCalc";
    private static final String START_URL = "file:///android_asset/index.html";
    private WebView webView;
    // 状态栏/导航栏高度(物理 px),用于注入 CSS 变量让 WebView 内容正确避让
    private int statusBarHeightPx = 0;
    private int navBarHeightPx = 0;
    private float density = 1f;
    // 开屏广告容器:覆盖在 WebView 之上,广告关闭/跳过后移除
    private FrameLayout splashAdContainer;
    // 标记主程序是否已进入(防止开屏广告回调重复触发 goHome)
    private volatile boolean homeEntered = false;
    // 标记浮窗广告是否已加载(避免重复加载)
    private volatile boolean floatingAdLoaded = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Activity 背景黑色,避免打开瞬间白屏
        getWindow().getDecorView().setBackgroundColor(Color.BLACK);

        // 沉浸式状态栏:状态栏透明,内容延伸到状态栏下方,与软件融为一体
        // (不使用 FLAG_TRANSLUCENT_STATUS,那个会加灰色遮罩且无法移除)
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);

        // 获取状态栏/导航栏高度,注入 CSS 变量让 WebView 内容正确避让
        // (env(safe-area-inset-*) 在部分 WebView 版本下不生效,改用 Java 注入更可靠)
        density = getResources().getDisplayMetrics().density;
        int resId = getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resId > 0) statusBarHeightPx = getResources().getDimensionPixelSize(resId);
        resId = getResources().getIdentifier("navigation_bar_height", "dimen", "android");
        if (resId > 0) navBarHeightPx = getResources().getDimensionPixelSize(resId);

        // 用 FrameLayout 包一下,确保 layout pass 正常
        FrameLayout root = new FrameLayout(this);
        root.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));

        webView = new WebView(this);
        // 注入原生桥:供前端「不同意并退出」与「读取系统主题」调用
        webView.addJavascriptInterface(new AppBridge(this), "appNative");
        // 强制硬件加速层
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);

        WebSettings s = webView.getSettings();
        // —— 基础 ——
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        // file:// 协议下加载本地资源
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        // —— 视口 ——
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        // 缓存:本地资源用默认
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        // 图片自动加载
        s.setLoadsImagesAutomatically(true);
        // 混合内容允许
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        webView.setWebChromeClient(new CalcChromeClient());
        webView.setWebViewClient(new CalcWebViewClient(this));

        root.addView(webView);
        setContentView(root);

        // 开屏广告容器:覆盖在 WebView 之上,fill 整屏
        splashAdContainer = new FrameLayout(this);
        splashAdContainer.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT));
        splashAdContainer.setBackgroundColor(Color.BLACK);
        root.addView(splashAdContainer);

        // === 合规延迟初始化(友盟官方要求) ===
        // 1. preInit:预初始化,仅做准备不采集数据,可在用户同意前调用
        UMAdSDK.preInit(this);

        // 2. 检查用户是否已同意协议(SharedPreferences 持久化)
        //    - 已同意 → init + 加载开屏广告(本次启动展示广告)
        //    - 未同意 → 跳过广告,等前端通知同意后再 init(本次启动不展示广告)
        boolean agreed = AgreementState.isChecked(this);
        if (agreed) {
            // 用户已同意,正式初始化 SDK 并加载开屏广告
            UMAdSDK.init(this);
            UMAdSDK.loadSplashAd(this, splashAdContainer, new SplashCallback(this));
        } else {
            // 首次启动/未同意:跳过开屏广告,直接进入主程序
            // 前端协议门会展示,用户同意后通过 appNative.onAgreementAccepted() 通知原生
            Log.d(TAG, "user not agreed yet, skip splash ad");
            goHome();
        }

        // 关键修复:等 layout pass 完成再加载 URL,避免 WebView 还没 attach 就 load
        // 这是 Vivo / Android 16 上黑屏的根因
        webView.getViewTreeObserver().addOnGlobalLayoutListener(new LayoutReadyListener(this));
    }

    /**
     * 进入主程序:移除开屏广告容器,加载 WebView URL。
     * 幂等:多次调用只会真正执行一次。
     */
    void goHome() {
        if (homeEntered) return;
        homeEntered = true;
        runOnUiThread(new GoHomeRunnable(this));
    }

    /**
     * 加载浮窗广告(幂等,仅加载一次)。
     * 由 WebView onPageFinished 或用户同意协议后触发。
     * SDK 未初始化时静默返回,不设置标记,等 SDK 初始化后可再次调用。
     */
    void loadFloatingAdOnce() {
        if (floatingAdLoaded) return;
        if (!UMAdSDK.isInited()) {
            Log.d(TAG, "floating: SDK not inited yet, defer");
            return;
        }
        floatingAdLoaded = true;
        UMAdSDK.loadFloatingBannerAd(this);
    }

    /** 命名 Runnable:在 UI 线程执行 goHome 主体(避免 Lambda 让 d8 崩溃) */
    static class GoHomeRunnable implements Runnable {
        private final MainActivity activity;
        GoHomeRunnable(MainActivity activity) { this.activity = activity; }
        @Override
        public void run() {
            // 移除开屏广告容器,露出 WebView
            FrameLayout splash = activity.splashAdContainer;
            if (splash != null && splash.getParent() != null) {
                ((ViewGroup) splash.getParent()).removeView(splash);
                activity.splashAdContainer = null;
            }
            // 确保 WebView 加载 URL
            WebView w = activity.webView;
            if (w != null && w.getTag() == null) {
                w.setTag("loaded");
                Log.d(TAG, "goHome: loading " + START_URL);
                w.loadUrl(START_URL);
            }
        }
    }

    /** 命名内部类:开屏广告回调(避免匿名内部类让 d8 崩溃) */
    static class SplashCallback implements UMAdSDK.SplashAdCallback {
        private final MainActivity activity;
        SplashCallback(MainActivity activity) { this.activity = activity; }
        @Override public void onLoaded() { /* 素材已就绪,等 onExposed */ }
        @Override public void onExposed() { /* 广告已展示,等 onDismissed */ }
        @Override public void onDismissed() { activity.goHome(); }
        @Override public void onSkip() { activity.goHome(); }
    }

    /** 命名内部类:等 layout pass 完成后进入主程序(与开屏广告回调共用 goHome) */
    static class LayoutReadyListener implements ViewTreeObserver.OnGlobalLayoutListener {
        private final MainActivity activity;

        LayoutReadyListener(MainActivity activity) {
            this.activity = activity;
        }

        @Override
        public void onGlobalLayout() {
            WebView w = activity.webView;
            if (w == null) return;
            if (w.getWidth() > 0 && w.getHeight() > 0) {
                if (w.getTag() == null) {
                    w.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                    Log.d(TAG, "layout ready, goHome");
                    // 如果开屏广告未触发 goHome(如 SDK 未接入直接 onSkip),
                    // layout 就绪后兜底进入主程序;goHome 内部会判重
                    activity.goHome();
                }
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    /** 命名内部类:捕获 console.log + JS alert 输出到 logcat */
    static class CalcChromeClient extends WebChromeClient {
        @Override
        public boolean onConsoleMessage(ConsoleMessage cm) {
            Log.d(TAG, "JS " + cm.message() + " (" + cm.sourceId() + ":" + cm.lineNumber() + ")");
            return true;
        }

        @Override
        public boolean onJsAlert(WebView v, String url, String msg, JsResult r) {
            Log.e(TAG, "JS ALERT: " + msg);
            r.confirm();
            return true;
        }

        @Override
        public boolean onJsPrompt(WebView v, String url, String msg, String def, JsPromptResult r) {
            Log.e(TAG, "JS PROMPT: " + msg);
            r.confirm();
            return true;
        }
    }

    /** 命名内部类:捕获资源加载错误,打印到 logcat */
    static class CalcWebViewClient extends WebViewClient {
        private final MainActivity activity;
        CalcWebViewClient(MainActivity activity) { this.activity = activity; }

        @Override
        public void onReceivedError(WebView v, WebResourceRequest req, WebResourceError err) {
            Log.e(TAG, "load err: " + req.getUrl() + " -> " + err.getDescription());
        }

        @Override
        public void onPageStarted(WebView v, String url, android.graphics.Bitmap favicon) {
            Log.d(TAG, "page started: " + url);
        }

        @Override
        public void onPageFinished(WebView v, String url) {
            Log.d(TAG, "page finished: " + url);
            // 注入状态栏/导航栏高度到 CSS 变量,让内容正确避让
            // (物理 px / density = CSS px)
            float topCss = activity.statusBarHeightPx / activity.density;
            float botCss = activity.navBarHeightPx / activity.density;
            String js = "document.documentElement.style.setProperty('--safe-top','" + topCss + "px');"
                    + "document.documentElement.style.setProperty('--safe-bottom','" + botCss + "px');";
            v.evaluateJavascript(js, null);

            // 主页加载完成后加载浮窗广告(仅一次)
            // SDK 未接入时 loadFloatingBannerAd 内部会静默返回
            activity.loadFloatingAdOnce();
        }
    }

    /** 命名 Runnable:在 UI 线程退出应用(JS 桥方法运行在 WebView 线程) */
    static class ExitRunnable implements Runnable {
        private final MainActivity activity;
        ExitRunnable(MainActivity activity) { this.activity = activity; }
        @Override
        public void run() {
            activity.finishAffinity();
        }
    }

    /** 命名 Runnable:在 UI 线程通知前端系统主题已变化 */
    static class NotifyThemeRunnable implements Runnable {
        private final MainActivity activity;
        NotifyThemeRunnable(MainActivity activity) { this.activity = activity; }
        @Override
        public void run() {
            activity.dispatchSystemThemeChanged();
        }
    }

    /**
     * JS 桥:前端通过 appNative 调用原生能力。
     * - exit():退出应用
     * - getSystemTheme():读取系统深浅色主题
     * - isAgreementAccepted():查询协议同意状态(原生 SharedPreferences)
     * - onAgreementAccepted():用户同意协议后通知原生初始化广告 SDK + 加载浮窗广告
     *
     * 注意:@JavascriptInterface 方法运行在 WebView 私有线程,不能直接操作 UI。
     */
    static class AppBridge {
        private final MainActivity activity;
        AppBridge(MainActivity activity) { this.activity = activity; }

        /** 退出应用 */
        @JavascriptInterface
        public void exit() {
            activity.runOnUiThread(new ExitRunnable(activity));
        }

        /**
         * 返回当前系统主题:"dark" 或 "light"。
         * WebView 默认不把 prefers-color-scheme 透传给 Web 内容,所以由原生直接读取
         * Configuration.uiMode 并返回字符串给 JS。
         */
        @JavascriptInterface
        public String getSystemTheme() {
            int uiMode = activity.getResources().getConfiguration().uiMode
                    & Configuration.UI_MODE_NIGHT_MASK;
            return (uiMode == Configuration.UI_MODE_NIGHT_YES) ? "dark" : "light";
        }

        /**
         * 查询用户是否已同意协议(原生 SharedPreferences)。
         * 前端启动时调用此方法,与 localStorage 双向同步。
         */
        @JavascriptInterface
        public boolean isAgreementAccepted() {
            return AgreementState.isChecked(activity);
        }

        /**
         * 用户同意协议后调用。
         * 1. 持久化同意状态到 SharedPreferences(下次启动直接初始化 SDK + 开屏广告)
         * 2. 正式初始化友盟 SDK(submitPolicyGrantResult + UMUnionSdk.init)
         * 3. 加载浮窗广告(本次启动已错过开屏,下次启动才展示)
         */
        @JavascriptInterface
        public void onAgreementAccepted() {
            Log.i(TAG, "user agreed, initializing ad SDK");
            // 1. 持久化同意状态
            AgreementState.setAccepted(activity);
            // 2. 正式初始化 SDK + 加载浮窗广告(在 UI 线程执行)
            activity.runOnUiThread(new InitAdRunnable(activity));
        }
    }

    /** 命名 Runnable:在 UI 线程初始化 SDK + 加载浮窗广告 */
    static class InitAdRunnable implements Runnable {
        private final MainActivity activity;
        InitAdRunnable(MainActivity activity) { this.activity = activity; }
        @Override
        public void run() {
            Log.d(TAG, "InitAdRunnable: start init SDK");
            // 正式初始化友盟 SDK(合规:用户已同意)
            boolean ok = UMAdSDK.init(activity);
            Log.d(TAG, "InitAdRunnable: init result=" + ok + ", inited=" + UMAdSDK.isInited());
            // 加载浮窗广告(本次启动已错过开屏,下次启动才展示开屏)
            activity.loadFloatingAdOnce();
            Log.d(TAG, "InitAdRunnable: loadFloatingAdOnce done, floatingAdLoaded=" + activity.floatingAdLoaded);
        }
    }

    /**
     * 系统主题变化时(用户在系统设置切换深浅色),主动通过 evaluateJavascript 通知前端。
     * 前端在 window 上挂载 __onNativeSystemThemeChange 回调接收。
     */
    void dispatchSystemThemeChanged() {
        if (webView == null) return;
        // 用 IIFE 安全调用,即使回调未定义也不报错
        String js = "(function(){"
                + "if(typeof window.__onNativeSystemThemeChange==='function'){"
                + "window.__onNativeSystemThemeChange();"
                + "}else{console.warn('[theme] native theme change received but no JS handler');}"
                + "})();";
        webView.evaluateJavascript(js, null);
        Log.d(TAG, "dispatched system theme change to JS");
    }

    /**
     * 系统配置变化时回调(包括深浅色切换)。
     * 注意:AndroidManifest 默认会让 Activity 重启,需在 manifest 中给 Activity 加
     * android:configChanges="uiMode" 才会走到这里;若未配置,本方法不会被调用,
     * 但 getSystemTheme() 仍能在每次前端调用时返回最新值。
     */
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        // 仅当 uiMode 变化时才通知前端,避免无谓刷新
        int newNight = newConfig.uiMode & Configuration.UI_MODE_NIGHT_MASK;
        int oldNight = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
        if (newNight != oldNight) {
            Log.d(TAG, "system uiMode changed -> " + (newNight == Configuration.UI_MODE_NIGHT_YES ? "dark" : "light"));
            runOnUiThread(new NotifyThemeRunnable(this));
        }
    }
}
