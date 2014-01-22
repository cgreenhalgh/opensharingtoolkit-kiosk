/**
 * 
 */
package org.opensharingtoolkit.chooser;

import java.io.File;
import java.lang.reflect.Method;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.InterfaceAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;

import org.json.JSONObject;
import org.opensharingtoolkit.common.Record;
import org.opensharingtoolkit.common.Recorder;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.net.wifi.SupplicantState;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.preference.PreferenceManager;
import android.util.Log;
import android.webkit.JavascriptInterface;

/** Helper functions for javascript in Kiosk.
 * 
 * @author pszcmg
 *
 */
public class JavascriptHelper {
	private static final String TAG = "JavascriptHelper";
	private Context mContext;
	//private RedirectServer mRedirectServer;
	private Recorder mRecorder;
	
	public JavascriptHelper(Context context/*, RedirectServer redirectServer*/) {
		super();
		this.mContext = context;
		//this.mRedirectServer = redirectServer;
		mRecorder = new Recorder(mContext, "chooser.js.helper");
	}
	
	/** get local IP address/domain name for use in URLs by other machines on network;
	 * most likely wireless 
	 * 
	 * @return IP address (as string)
	 */
	@JavascriptInterface
	public String getHostAddress() {
		Enumeration<NetworkInterface> nis;
		try {
			nis = NetworkInterface.getNetworkInterfaces();
		} catch (SocketException e) {
			Log.e(TAG,"getHostAddress could not getNetworkInterfaces: "+e.getMessage(), e);
			mRecorder.w("js.query.host.failed", null);
			return "127.0.0.1";
		}
		LinkedList<NetworkInterface> bestnis = new LinkedList<NetworkInterface>();
		// order best?!
		while (nis.hasMoreElements()) {
			NetworkInterface ni = nis.nextElement();
			String name = ni.getName().toLowerCase(Locale.US);
			if (name.startsWith("lo")) {
				Log.d(TAG, "skip loopback interface "+name);
				continue;
			}
			if (name.startsWith("w")) 
				bestnis.addFirst(ni);
			else
				bestnis.addLast(ni);
		}
		for (NetworkInterface ni : bestnis) {
			// IPv4 only for now?!
			List<InterfaceAddress> ias = ni.getInterfaceAddresses();
			for (InterfaceAddress ia : ias) {
				InetAddress addr = ia.getAddress();
				if (addr.isLoopbackAddress())
					continue;
				if (addr.isMulticastAddress())
					continue;
				if (addr instanceof Inet4Address) {
					JSONObject jo = new JSONObject();
					try {
						jo.put("addr", addr.getHostAddress());
						jo.put("if", ni.getName());
					}
					catch (Exception e) {
						Log.e(TAG,"marshalling networkinterface for recorder", e);
					}
					mRecorder.d("js.query.host.success", jo);
					return addr.getHostAddress();
				}
			}
			Log.d(TAG,"Could not find useful address for interface "+ni.getName());
		}
		Log.w(TAG,"Could not find useful local IP address - using loopback");
		return "127.0.0.1";
	}
	@JavascriptInterface
	public int getPort() {
		return Service.HTTP_PORT;
	}
	private Intent makeIntent(String url, String mimeTypeHint) {
		Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
		i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
		// NB i found that if you set mime type for PDF then adobe reader doesn't open the document.
		// not sure why at the moment...
		if(mimeTypeHint!=null)
			i.setType(mimeTypeHint);
		return i;
	}
	/** open/handle entry enclosure
	 * 
	 * @return true if handled
	 */
	@JavascriptInterface
	public boolean openUrl(String url, String mimeTypeHint, String pageurl) {
		Log.d(TAG,"openEntry("+url+","+mimeTypeHint+","+pageurl);
		JSONObject jo = new JSONObject();
		try {
			jo.put("url", url);
			jo.put("mimeTypeHint", mimeTypeHint);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling openUrl info", e);
		}		
		if (canOpenUrl(url,mimeTypeHint, pageurl)) {
			try {
				Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
				i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
				// NB i found that if you set mime type for PDF then adobe reader doesn't open the document.
				// not sure why at the moment...
				//if(mimeTypeHint!=null)
				//	i.setType(mimeTypeHint);
				mContext.startActivity(i);
				mRecorder.i("js.openUrl.success", jo);
				return true;
			} catch (Exception e) {
				Log.w(TAG,"Error opening "+url+" "+mimeTypeHint+" using intent", e);
				try {
					jo.put("exception", e.toString());
				}
				catch (Exception e2) {
					Log.e(TAG,"Error marshalling openUrl error info", e2);
				}
				mRecorder.i("js.openUrl.error", jo);
				return false;
			}
		}
		return false;
	}
	/** open/handle entry enclosure
	 * 
	 * @return true if handled
	 */
	@JavascriptInterface
	public boolean canOpenUrl(String url, String mimeTypeHint, String pageurl) {
		//Log.d(TAG,"openEntry("+url+","+mimeTypeHint+","+pageurl);
		Intent i = makeIntent(url, mimeTypeHint);
		PackageManager packageManager = mContext.getPackageManager();
		List<ResolveInfo> activities = packageManager.queryIntentActivities(i, 0);
		if(activities.size() == 0) {
			Log.w(TAG,"No handler for intent "+url+" as "+mimeTypeHint);
			return false;
		} 
		Log.d(TAG,"- "+activities.size()+" activities match: ");
		for (int ai=0; ai<activities.size(); ai++)
			Log.d(TAG,"-- "+activities.get(ai).toString());
		return true;
	}
	
	/** get SSID of current wifi network.
	 * 
	 *  @return null if no network.
	 */
	@JavascriptInterface
	public String getWifiSsid() {
		JSONObject jo = new JSONObject();
		WifiManager wifiManager = (WifiManager) mContext.getSystemService(Context.WIFI_SERVICE);
		int state = wifiManager.getWifiState();
		if (state==WifiManager.WIFI_STATE_ENABLED || state==WifiManager.WIFI_STATE_ENABLING) {
			WifiInfo connectionInfo = wifiManager.getConnectionInfo();
			String ssid = connectionInfo.getSSID();
			// remove quotes (=> UTF-8 encodable)
			if (ssid.startsWith("\"") && ssid.endsWith("\""))
				ssid = ssid.substring(1, ssid.length()-1);
			SupplicantState ss = connectionInfo.getSupplicantState();
			Log.d(TAG,"Wifi is "+ssid+" ("+ss.name()+")"+(state==WifiManager.WIFI_STATE_ENABLING ? " enabling...":""));
			try {
				jo.put("type","client");
				jo.put("ssid", ssid);
				jo.put("name", ss.name());
				jo.put("state", state);
			}
			catch (Exception e) {
				Log.e(TAG,"Error marshalling getWifiSsid info", e);
			}
			mRecorder.i("js.query.wifiSsid.success", jo);
			return ssid;
		}
		else
			Log.d(TAG,"Wifi state="+state);
		// are we a hotspot? need non-documented methods...
		// http://stackoverflow.com/questions/6394599/android-turn-on-off-wifi-hotspot-programmatically
		//wifiControlMethod = mWifiManager.getClass().getMethod("setWifiApEnabled", WifiConfiguration.class,boolean.class);
		int apstate = -1;
		try {
		    Method wifiApConfigurationMethod = wifiManager.getClass().getMethod("getWifiApConfiguration");
			Method wifiApState = wifiManager.getClass().getMethod("getWifiApState");
			apstate = (Integer)wifiApState.invoke(wifiManager);
			//if (apstate==WifiManager.WIFI_STATE_ENABLED || apstate==WifiManager.WIFI_STATE_ENABLING) {
			WifiConfiguration configInfo = (WifiConfiguration)wifiApConfigurationMethod.invoke(wifiManager);
			String ssid = configInfo!=null ? configInfo.SSID : null;
			Log.d(TAG,"WifiAp is "+ssid+" (apstate="+apstate+")");
			// apstate 13 seen when running hotspot...; 11 when not running
			// cf 3 normal wifi enabled?
			if (apstate==13 || apstate==12) {
				try {
					jo.put("type","hotspot");
					jo.put("ssid", ssid);
					jo.put("apstate", apstate);
				}
				catch (Exception e) {
					Log.e(TAG,"Error marshalling getWifiSsid info", e);
				}
				mRecorder.i("js.query.wifiSsid.success", jo);
				return ssid;
			}
		} catch (Exception e) {
			Log.w(TAG,"Unable to find WifiAp methods: "+e);
		}
		try {
			if (apstate>=0)
				jo.put("apstate", apstate);
			jo.put("state", state);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling getWifiSsid error info", e);
		}
		mRecorder.i("js.query.wifiSsid.error", jo);
	    return null;
	}

	/** register temporary redirect.
	 * 
	 *  @return Redirect path 
	 */
	@JavascriptInterface
	public String registerTempRedirect(String toUrl, long lifetimeMs) {
		String path = RedirectServer.singleton().registerTempRedirect(toUrl, lifetimeMs);
		JSONObject jo = new JSONObject();
		try {
			jo.put("toUrl", toUrl);
			jo.put("lifetime", lifetimeMs);
			jo.put("path", path);
		}
		catch (Exception e) {
			Log.w(TAG,"Error marshalling info for redirect", e);			
		}
		mRecorder.i("js.registerRedirect", jo);
		return path;
	}
	/** get path of configured atom file
	 * 
	 * @return path
	 */
	@JavascriptInterface
	public String getAtomFile() {
		SharedPreferences spref = PreferenceManager.getDefaultSharedPreferences(mContext);
		String atomfile = spref.getString("pref_atomfile", "default.xml");
		JSONObject jo = new JSONObject();
		try {
			jo.put("filename", atomfile);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling getAtomFile info", e);	
		}
		mRecorder.i("js.query.atomFile", jo);
		return atomfile;
	}
	/** get path prefix for local files
	 * 
	 * @return path
	 */
	@JavascriptInterface
	public String getLocalFilePrefix() {
		// should be on external storage
		File dir = mContext.getExternalFilesDir(null);
		if (dir==null) {
			mRecorder.i("js.query.localFilePrefix.error", null);
			Log.w(TAG, "getLocalFilePrefix with external storage not available");
			return null;
		}
		String url = dir.toURI().toString();
		if (url.endsWith("/"))
			url = url.substring(0, url.length()-1);
		if (url.startsWith("file:/") && !url.startsWith("file:///"))
			// extra //
			url = "file:///"+url.substring("file:/".length());
		JSONObject jo = new JSONObject();
		try {
			jo.put("url", url);
		}
		catch (Exception e) {
			Log.e(TAG,"Error marshalling getLocalFilePrefix info", e);	
		}
		mRecorder.i("js.query.localFilePrefix.success", jo);
		return url;
	}
	/** log to Record 
	 * 
	 */
	@JavascriptInterface
	public void record(int level, String event, String jsonInfo) {
		Record.logJson(mContext, level, "chooser.js", event, jsonInfo);
	}
}
