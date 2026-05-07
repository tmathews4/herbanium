package app.herbanium;

import android.content.res.Configuration;
import android.graphics.drawable.ColorDrawable;
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

        // Paint the activity window background to match the app shell
        // so the strip we reserve above the WebView (where the system
        // status icons live) reads as part of the app rather than a
        // foreign white bar. Picks light or dark ivory based on the
        // system Configuration.UI_MODE_NIGHT bit, matching the React
        // app's prefers-color-scheme handling.
        int nightBit = getResources().getConfiguration().uiMode
            & Configuration.UI_MODE_NIGHT_MASK;
        boolean isDark = nightBit == Configuration.UI_MODE_NIGHT_YES;
        // Light: #F3ECDC (theme.ivory). Dark: #0F1410 (--ivory-rgb 15,20,16).
        int shellColor = isDark ? 0xFF0F1410 : 0xFFF3ECDC;
        getWindow().setBackgroundDrawable(new ColorDrawable(shellColor));

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
