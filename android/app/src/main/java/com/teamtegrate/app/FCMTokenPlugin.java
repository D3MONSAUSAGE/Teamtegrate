package com.teamtegrate.app;

import android.content.SharedPreferences;
import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.JSObject;

@CapacitorPlugin(name = "FCMToken")
public class FCMTokenPlugin extends Plugin {
    
    @PluginMethod
    public void getToken(PluginCall call) {
        Context context = getContext();
        SharedPreferences prefs = context.getSharedPreferences("FCMPrefs", Context.MODE_PRIVATE);
        String token = prefs.getString("fcm_token", null);
        
        JSObject ret = new JSObject();
        if (token != null) {
            ret.put("token", token);
            ret.put("success", true);
            call.resolve(ret);
        } else {
            ret.put("success", false);
            ret.put("error", "No FCM token found in storage");
            call.reject("No token found", ret);
        }
    }
}
