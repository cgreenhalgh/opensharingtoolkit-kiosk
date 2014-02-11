/**
 * 
 */
package org.opensharingtoolkit.common;

import java.lang.reflect.Method;

import android.content.Context;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiManager;
import android.util.Log;

/**
 * @author pszcmg
 *
 */
public class WifiUtils {

	public static final int WIFI_AP_STATE_DISABLLING = 10;
	public static final int WIFI_AP_STATE_DISABLED = 11;
	public static final int WIFI_AP_STATE_ENABLING = 12;
	public static final int WIFI_AP_STATE_ENABLED = 13;
	private static final String TAG = "wifi-utils";
	
	/** NB gets WifiAp status if Wifi disabled */
	public static int getWifiState(Context context) {
		WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
		int state = wifiManager.getWifiState();
		if (state!=WifiManager.WIFI_STATE_DISABLED)
			return state;
		// are we a hotspot? need non-documented methods...
		// http://stackoverflow.com/questions/6394599/android-turn-on-off-wifi-hotspot-programmatically
		//wifiControlMethod = mWifiManager.getClass().getMethod("setWifiApEnabled", WifiConfiguration.class,boolean.class);
		try {
			Method wifiApState = wifiManager.getClass().getMethod("getWifiApState");
			int apstate = (Integer)wifiApState.invoke(wifiManager);
			if (apstate!=WIFI_AP_STATE_DISABLED)
				return apstate;
		}
		catch (Exception e) {
			Log.w(TAG,"Error checking WifiAp state: "+e);
		}
		return state;
	}
	public static boolean setWifiEnabled(Context context, boolean enabled) {
		//if (enabled)
		//	setWifiApEnabled(context, false);
		WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
		Log.d(TAG,"setWifiEnabled "+enabled);
		return wifiManager.setWifiEnabled(enabled);
	}
	public static boolean setWifiApEnabled(Context context, String ssid, boolean enabled) {
		//if (enabled)
		//	setWifiEnabled(context, false);
		WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
		try {
			Log.d(TAG,"setWifiApEnabled "+ssid+", "+enabled);
			WifiConfiguration apConfig = new WifiConfiguration();
			// open by default??
			apConfig.SSID = ssid;
			Method setWifiApEnabled = wifiManager.getClass().getMethod("setWifiApEnabled", WifiConfiguration.class, boolean.class);
			return (Boolean)setWifiApEnabled.invoke(wifiManager, apConfig, enabled);
		}
		catch (Exception e) {
			Log.w(TAG,"Error setting WifiAp state: "+e);
		}
		return false;
	}
	public static WifiConfiguration getWifiApConfiguration(Context context) {
		WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
		try {
			Method getWifiApConfiguration = wifiManager.getClass().getMethod("getWifiApConfiguration");
			return (WifiConfiguration)getWifiApConfiguration.invoke(wifiManager);
		}
		catch (Exception e) {
			Log.w(TAG,"Error getting WifiApConfiguration: "+e);
		}
		return null;
		
	}
}
