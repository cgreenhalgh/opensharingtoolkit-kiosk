/**
 * 
 */
package org.opensharingtoolkit.kiosk;

import java.lang.reflect.InvocationTargetException;
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

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import android.net.wifi.SupplicantState;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
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
	
	
	public JavascriptHelper(Context context/*, RedirectServer redirectServer*/) {
		super();
		this.mContext = context;
		//this.mRedirectServer = redirectServer;
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
				if (addr instanceof Inet4Address)
					return addr.getHostAddress();
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
	/** open/handle entry enclosure
	 * 
	 * @return true if handled
	 */
	@JavascriptInterface
	public boolean openUrl(String url, String mimeTypeHint, String pageurl) {
		Log.d(TAG,"openEntry("+url+","+mimeTypeHint+","+pageurl);
		try {
			Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
			i.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
			// NB don't set mime type, at least for PDF, as it doesn't then open the document.
			//if(mimeTypeHint!=null)
			//	i.setType(mimeTypeHint);
			PackageManager packageManager = mContext.getPackageManager();
			List<ResolveInfo> activities = packageManager.queryIntentActivities(i, 0);
			if(activities.size() == 0) {
				Log.w(TAG,"No handler for intent "+url+" as "+mimeTypeHint);
				return false;
			}
			mContext.startActivity(i);
			return true;
		} catch (Exception e) {
			Log.w(TAG,"Error opening "+url+" "+mimeTypeHint+" using intent", e);
			return false;
		}
	}
	
	/** get SSID of current wifi network.
	 * 
	 *  @return null if no network.
	 */
	@JavascriptInterface
	public String getWifiSsid() {
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
			return ssid;
		}
		else
			Log.d(TAG,"Wifi state="+state);
		// are we a hotspot? need non-documented methods...
		// http://stackoverflow.com/questions/6394599/android-turn-on-off-wifi-hotspot-programmatically
		//wifiControlMethod = mWifiManager.getClass().getMethod("setWifiApEnabled", WifiConfiguration.class,boolean.class);
	    try {
		    Method wifiApConfigurationMethod = wifiManager.getClass().getMethod("getWifiApConfiguration");
			Method wifiApState = wifiManager.getClass().getMethod("getWifiApState");
			int apstate = (Integer)wifiApState.invoke(wifiManager);
			//if (apstate==WifiManager.WIFI_STATE_ENABLED || apstate==WifiManager.WIFI_STATE_ENABLING) {
			WifiConfiguration configInfo = (WifiConfiguration)wifiApConfigurationMethod.invoke(wifiManager);
			String ssid = configInfo!=null ? configInfo.SSID : null;
			Log.d(TAG,"WifiAp is "+ssid+" (apstate="+apstate+")");
			// apstate 13 seen when running hotspot...; 11 when not running
			// cf 3 normal wifi enabled?
			if (apstate==13 || apstate==12)
				return ssid;
		} catch (Exception e) {
			Log.w(TAG,"Unable to find WifiAp methods: "+e);
		}
	    return null;
	}

	/** register temporary redirect.
	 * 
	 *  @return Redirect path 
	 */
	@JavascriptInterface
	public String registerTempRedirect(String toUrl, long lifetimeMs) {
		
		return RedirectServer.singleton().registerTempRedirect(toUrl, lifetimeMs);
	}
}
