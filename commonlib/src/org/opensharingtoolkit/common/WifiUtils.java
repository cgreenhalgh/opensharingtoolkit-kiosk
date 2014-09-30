/**
 * 
 */
package org.opensharingtoolkit.common;

import java.lang.reflect.Method;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;
import java.util.LinkedList;
import java.util.Locale;

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
	public static final String WIFI_AP_STATE_CHANGED_ACTION = "android.net.wifi.WIFI_AP_STATE_CHANGED";
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
	/** get local IP address/domain name for use in URLs by other machines on network;
	 * most likely wireless 
	 * 
	 * @return IP address (as string)
	 */
	public static String getHostAddress() {
		NetworkInterface ni = getWifiInterface();
		return getHostAddress(ni);
	}
	public static String getHostAddress(NetworkInterface ni) {
		if (ni==null) {
			Log.w(TAG,"Could not find local interface - using loopback");
			return "127.0.0.1";
		}
		// IPv4 only for now?!
		Enumeration<InetAddress> ias = ni.getInetAddresses();
		while (ias.hasMoreElements()) {
			InetAddress addr = ias.nextElement();
			if (addr.isLoopbackAddress())
				continue;
			if (addr.isMulticastAddress())
				continue;
			if (addr instanceof Inet4Address) {
				return addr.getHostAddress();
			}
		}
		Log.w(TAG,"Could not find useful local IP address - using loopback");
		return "127.0.0.1";
	}

	public static NetworkInterface getWifiInterface() {
		Enumeration<NetworkInterface> nis;
		try {
			nis = NetworkInterface.getNetworkInterfaces();
		} catch (SocketException e) {
			Log.e(TAG,"getWifiInterface could not getNetworkInterfaces: "+e.getMessage(), e);
			return null;
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
			Enumeration<InetAddress> ias = ni.getInetAddresses();
			while (ias.hasMoreElements()) {
				InetAddress addr = ias.nextElement();
				if (addr.isLoopbackAddress())
					continue;
				if (addr.isMulticastAddress())
					continue;
				if (addr instanceof Inet4Address) {
					return ni;
				}
			}
			Log.d(TAG,"Could not find useful address for interface "+ni.getName());
		}
		Log.w(TAG,"Could not find likely Wifi interface");
		return null;
		
	}
}
