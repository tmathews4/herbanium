package app.herbanium;

import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    /**
     * On Android 15+ (API 35+), apps targeting that SDK have
     * edge-to-edge mode enforced — the older opt-outs
     * (WindowCompat.setDecorFitsSystemWindows(window, true),
     * android:fitsSystemWindows on the theme, android:statusBarColor)
     * all become no-ops. The WebView extends under the status bar
     * and gesture nav regardless, and content like the Home poem
     * card or in-app back buttons end up unreachable beneath the
     * system icons.
     *
     * Mandatory fix at targetSdk 35+: consume the system-bar +
     * display-cutout insets ourselves and apply them as padding to
     * the activity's content view. The WebView then starts below
     * the status bar and ends above the gesture nav, restoring
     * the pre-edge-to-edge behavior on a per-frame basis.
     *
     * The legacy setDecorFitsSystemWindows call still helps on
     * Android 14- where the listener-based approach isn't needed,
     * so it stays as a belt-and-suspenders.
     */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);

        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (v, windowInsets) -> {
            Insets bars = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars()
                | WindowInsetsCompat.Type.displayCutout()
            );
            v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsetsCompat.CONSUMED;
        });
    }
}
