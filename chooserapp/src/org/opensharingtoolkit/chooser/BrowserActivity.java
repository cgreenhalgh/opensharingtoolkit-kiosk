/**
 * 
 */
package org.opensharingtoolkit.chooser;

import org.json.JSONException;
import org.json.JSONObject;
import org.opensharingtoolkit.chooser.R;
import org.opensharingtoolkit.common.Recorder;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Bitmap;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;
import android.view.KeyEvent;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions.Callback;
import android.webkit.HttpAuthHandler;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceResponse;
import android.webkit.WebStorage.QuotaUpdater;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

/**
 * @author pszcmg
 *
 */
public class BrowserActivity extends Activity {

	public static final String TAG = "kiosk";

	protected Recorder mRecorder;

	public BrowserActivity(String component) {
		mRecorder = new Recorder(this, component);
	}
	
	@SuppressLint("SetJavaScriptEnabled")
	@Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_browser);
        WebView webView = (WebView)findViewById(R.id.webView);
        webView.addJavascriptInterface(new JavascriptHelper(getApplicationContext()), "kiosk");
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setAllowFileAccessFromFileURLs(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setBuiltInZoomControls(false);
        webView.getSettings().setDatabasePath(getApplicationContext().getFilesDir().getPath()+"/org.opensharingtoolkit.chooser/databases/");
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebChromeClient(new WebChromeClient() {
        	public void onProgressChanged(WebView view, int progress) {
        		Log.d(TAG,"progress "+progress);
        	}

			@Override
			public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
				// Note, default onConsoleMessage will output the information to Log
				//String msg = "console: ("+consoleMessage.sourceId()+":"+consoleMessage.lineNumber()+") "+consoleMessage.message();
				return super.onConsoleMessage(consoleMessage);
			}

			@Override
			public void onExceededDatabaseQuota(String url,
					String databaseIdentifier, long quota,
					long estimatedDatabaseSize, long totalQuota,
					QuotaUpdater quotaUpdater) {
				// TODO Auto-generated method stub
				super.onExceededDatabaseQuota(url, databaseIdentifier, quota,
						estimatedDatabaseSize, totalQuota, quotaUpdater);
			}

			@Override
			public void onGeolocationPermissionsHidePrompt() {
				// TODO Auto-generated method stub
				super.onGeolocationPermissionsHidePrompt();
			}

			@Override
			public void onGeolocationPermissionsShowPrompt(String origin,
					Callback callback) {
				// TODO Auto-generated method stub
				super.onGeolocationPermissionsShowPrompt(origin, callback);
			}

			@Override
			public boolean onJsAlert(WebView view, String url, String message,
					JsResult result) {
				Log.w(TAG,"onJsAlert: ("+url+") "+message+" ("+result+")");
				JSONObject jo = new JSONObject();
				try {
					jo.put("url", url);
					jo.put("message", message);
				} catch (JSONException e) {
					Log.w(TAG,"Error converting JsAlert to json", e);
				}
				mRecorder.w("js.alert", jo);
				// TODO Auto-generated method stub
				return super.onJsAlert(view, url, message, result);
			}

			@Override
			public boolean onJsBeforeUnload(WebView view, String url,
					String message, JsResult result) {
				// TODO Auto-generated method stub
				return super.onJsBeforeUnload(view, url, message, result);
			}

			@Override
			public boolean onJsConfirm(WebView view, String url,
					String message, JsResult result) {
				// TODO Auto-generated method stub
				return super.onJsConfirm(view, url, message, result);
			}

			@Override
			public boolean onJsPrompt(WebView view, String url, String message,
					String defaultValue, JsPromptResult result) {
				// TODO Auto-generated method stub
				return super.onJsPrompt(view, url, message, defaultValue, result);
			}

			@Override
			public void onReachedMaxAppCacheSize(long requiredStorage,
					long quota, QuotaUpdater quotaUpdater) {
				// TODO Auto-generated method stub
				super.onReachedMaxAppCacheSize(requiredStorage, quota, quotaUpdater);
			}

			@Override
			public void onReceivedTitle(WebView view, String title) {
				// TODO Auto-generated method stub
				super.onReceivedTitle(view, title);
			}
        	
        });
        webView.setWebViewClient(new WebViewClient() {
        	public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
        		// this picks up local errors aswell
        		Log.d(TAG,"onReceivedError errorCode="+errorCode+", description="+description+", failingUrl="+failingUrl); 
        		Toast.makeText(BrowserActivity.this, "Oh no! " + description, Toast.LENGTH_SHORT).show();
        	}

			@Override
			public void onFormResubmission(WebView view, Message dontResend,
					Message resend) {
				// TODO Auto-generated method stub
				super.onFormResubmission(view, dontResend, resend);
			}

			@Override
			public void onLoadResource(WebView view, String url) {
				Log.d(TAG,"onLoadResource "+url);
				// TODO Auto-generated method stub
				super.onLoadResource(view, url);
			}

			@Override
			public void onPageFinished(WebView view, String url) {
				// TODO Auto-generated method stub
				super.onPageFinished(view, url);
			}

			@Override
			public void onPageStarted(WebView view, String url, Bitmap favicon) {
				// TODO Auto-generated method stub
				super.onPageStarted(view, url, favicon);
			}

			@Override
			public void onReceivedHttpAuthRequest(WebView view,
					HttpAuthHandler handler, String host, String realm) {
				// TODO Auto-generated method stub
				super.onReceivedHttpAuthRequest(view, handler, host, realm);
			}

			@Override
			public void onReceivedLoginRequest(WebView view, String realm,
					String account, String args) {
				// TODO Auto-generated method stub
				super.onReceivedLoginRequest(view, realm, account, args);
			}

			@Override
			public void onReceivedSslError(WebView view,
					SslErrorHandler handler, SslError error) {
				// TODO Auto-generated method stub
				super.onReceivedSslError(view, handler, error);
			}

			@Override
			public void onScaleChanged(WebView view, float oldScale,
					float newScale) {
				// TODO Auto-generated method stub
				super.onScaleChanged(view, oldScale, newScale);
			}

			@Override
			public void onUnhandledKeyEvent(WebView view, KeyEvent event) {
				// TODO Auto-generated method stub
				super.onUnhandledKeyEvent(view, event);
			}

			@Override
			public WebResourceResponse shouldInterceptRequest(WebView view,
					String url) {
				Log.d(TAG,"shouldInterceptRequest "+url);
				// TODO Auto-generated method stub
				return super.shouldInterceptRequest(view, url);
			}

			@Override
			public void doUpdateVisitedHistory(WebView view, String url,
					boolean isReload) {
				Log.d(TAG,"doUpdateVisitedHistory url="+url+", isReload="+isReload);
				// TODO Auto-generated method stub
				super.doUpdateVisitedHistory(view, url, isReload);
			}

			@Override
			public boolean shouldOverrideUrlLoading(WebView view, String url) {
				Log.d(TAG,"shouldOverrideUrlLoading url="+url);
				// TODO Auto-generated method stub
				return super.shouldOverrideUrlLoading(view, url);
			}
        	
        });

        String url = getString(R.string.default_url);
        Log.d(TAG,"load default url "+url);
        webView.loadUrl(url);
    }

	protected boolean handleBackPressed() {
        WebView webView = (WebView)findViewById(R.id.webView);
        if (webView!=null && webView.canGoBack()) {
    		Log.d(TAG,"Back in web history");
        	webView.goBack();
        	return true;
        }		
        return false;
	}
	
	@Override
	public void onBackPressed() {
		if (!handleBackPressed())
			super.onBackPressed();
	}    
}
