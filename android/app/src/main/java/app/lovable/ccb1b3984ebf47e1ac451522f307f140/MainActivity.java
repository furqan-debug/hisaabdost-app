package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.EdgeToEdge;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Enable edge-to-edge display for Android 15+ compatibility
        EdgeToEdge.enable(this);
        
        super.onCreate(savedInstanceState);
        registerPlugin(AppOpenAdPlugin.class);
        
        // Enable auto-fill for WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.getSettings().setSaveFormData(true);
            webView.getSettings().setSavePassword(true);
            
            // Handle window insets for edge-to-edge
            ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
                var insets = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars());
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                return WindowInsetsCompat.CONSUMED;
            });
        }
    }
}
