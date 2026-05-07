package app.herbanium;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // No custom inset handling here. At targetSdk 35+ Android 15
    // forces edge-to-edge — the WebView extends under the status
    // bar and gesture nav, and the React app shell takes care of
    // reserving its own breathing room at the top via a painted
    // top buffer in PhoneFrame. That keeps the spacing visible in
    // the app's color rather than as a foreign system-bg strip.
}
