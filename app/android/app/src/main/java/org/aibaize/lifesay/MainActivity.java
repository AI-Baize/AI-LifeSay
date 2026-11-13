package org.aibaize.lifesay;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(android.os.Bundle state) {
        registerPlugin(DeviceApplicationPlugin.class);
        registerPlugin(ListeningPlugin.class);
        super.onCreate(state);
    }
}
