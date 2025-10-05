package com.teamtegrate.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.capacitor.pushnotifications.PushNotificationsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register plugins
        registerPlugin(PushNotificationsPlugin.class);
        registerPlugin(FCMTokenPlugin.class);
    }
}
