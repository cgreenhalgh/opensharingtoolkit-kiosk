/**
 * 
 */
package org.opensharingtoolkit.kiosk;

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
	
	
	public JavascriptHelper(Context mContext) {
		super();
		this.mContext = mContext;
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
}
