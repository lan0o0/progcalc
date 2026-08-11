package com.progcalc.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

/**
 * 协议同意状态持久化(原生 SharedPreferences)。
 *
 * 用途:让原生层在 App 启动时即可判断用户是否已同意协议,
 * 决定是否初始化广告 SDK(合规延迟初始化)。
 *
 * 前端 AgreementGate 在用户点击「同意」时,通过 appNative.onAgreementAccepted()
 * 通知原生写入 SharedPreferences;同时前端也会写 localStorage,两边保持同步。
 */
public final class AgreementState {
    private static final String TAG = "ProgCalc.Agreement";
    private static final String PREF_NAME = "progcalc";
    private static final String KEY_AGREED = "agreement.accepted";

    private AgreementState() {}

    /** 检查用户是否已同意协议 */
    public static boolean isChecked(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            return sp.getBoolean(KEY_AGREED, false);
        } catch (Throwable t) {
            Log.e(TAG, "isChecked failed", t);
            return false;
        }
    }

    /** 标记用户已同意协议(持久化到 SharedPreferences) */
    public static void setAccepted(Context context) {
        try {
            SharedPreferences sp = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            sp.edit().putBoolean(KEY_AGREED, true).apply();
            Log.i(TAG, "agreement accepted saved");
        } catch (Throwable t) {
            Log.e(TAG, "setAccepted failed", t);
        }
    }
}
