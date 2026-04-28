package app.herbanium;

import android.os.Bundle;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /**
     * Capacitor 8's BridgeActivity calls
     * WindowCompat.setDecorFitsSystemWindows(window, false) inside
     * super.onCreate(), which forces the WebView to extend edge-to-
     * edge under the system status bar regardless of any theme-level
     * fitsSystemWindows attribute.
     *
     * Override that here: after super.onCreate runs, flip the flag
     * back to true so Android reserves the status-bar inset properly.
     * The status-bar styling (color, light icons) is set in
     * AppTheme.NoActionBarLaunch in res/values/styles.xml; this just
     * gives that styling the strip of pixels it needs to render in.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
