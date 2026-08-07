package com.progcalc.app;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
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
        // 注入原生桥:供前端「不同意并退出」调用,仅暴露 exit()
        webView.addJavascriptInterface(new ExitBridge(this), "appNative");
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

        // 关键修复:等 layout pass 完成再加载 URL,避免 WebView 还没 attach 就 load
        // 这是 Vivo / Android 16 上黑屏的根因
        webView.getViewTreeObserver().addOnGlobalLayoutListener(new LayoutReadyListener(this));
    }

    /** 命名内部类:等 layout pass 完成后再加载 URL */
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
                    w.setTag("loaded");
                    Log.d(TAG, "layout ready, loading " + START_URL);
                    w.getViewTreeObserver().removeOnGlobalLayoutListener(this);
                    w.post(new LoadUrlTask(activity));
                }
            }
        }
    }

    /** 命名 Runnable:在 UI 线程加载 URL */
    static class LoadUrlTask implements Runnable {
        private final MainActivity activity;

        LoadUrlTask(MainActivity activity) {
            this.activity = activity;
        }

        @Override
        public void run() {
            if (activity.webView != null) {
                activity.webView.loadUrl(START_URL);
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

    /** JS 桥:前端调用 appNative.exit() 退出应用,仅暴露 exit() */
    static class ExitBridge {
        private final MainActivity activity;
        ExitBridge(MainActivity activity) { this.activity = activity; }
        @JavascriptInterface
        public void exit() {
            activity.runOnUiThread(new ExitRunnable(activity));
        }
    }
}
