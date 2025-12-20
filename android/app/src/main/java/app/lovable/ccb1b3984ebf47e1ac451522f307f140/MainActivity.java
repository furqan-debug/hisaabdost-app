package app.lovable.ccb1b3984ebf47e1ac451522f307f140;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(AppOpenAdPlugin.class);
        
        // Enable auto-fill for WebView
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.getSettings().setSaveFormData(true);
            webView.getSettings().setSavePassword(true);
        }
    }
}
